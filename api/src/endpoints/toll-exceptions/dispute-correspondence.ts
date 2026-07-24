import { NcqpCorrespondence } from '../../models/ncqp/NcqpCorrespondence';

/** How the agency resolved a dispute, derived from the case status + notes. */
export type DisputeDecision = 'under_review' | 'denied' | 'approved';

/** A customer dispute, assembled from the correspondence records for one case number. */
export interface Dispute {
  /** Customer-facing case number (the ticket number shown in correspondence). */
  caseNumber: string;
  createdDate: string | null;
  /** Raw case status label: "Filed", "Open", or "Closed". */
  status: string;
  decision: DisputeDecision;
  /** Agency decision text (HTML stripped), or null before any response. */
  decisionNotes: string | null;
  lastUpdated: string | null;
  /** documentID of the attached vehicle image, if the agency included one. */
  attachmentDocumentId: string | null;
}

const CREATED = 'Customer Case Created Confirmation';
const UPDATED = 'Case Updated';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Pull the case number out of "...case ID is 123", "...case number is 123", "...case number: 123". */
function caseNumberFrom(text: string): string | null {
  const m = /case (?:id|number)\s*(?:is|:)?\s*#?(\d+)/i.exec(text);
  return m && m[1] ? m[1] : null;
}

function firstMatch(text: string, re: RegExp): string | null {
  const m = re.exec(text);
  return m && m[1] ? m[1].trim() : null;
}

function decisionFrom(status: string, notes: string | null): DisputeDecision {
  if (!/closed/i.test(status)) return 'under_review';
  return /approv|credit|waiv|remov|in your favor/i.test(notes ?? '') ? 'approved' : 'denied';
}

interface Draft {
  caseNumber: string;
  createdDate: string | null;
  updatedDate: string | null;
  status: string;
  decisionNotes: string | null;
  lastUpdated: string | null;
  attachmentDocumentId: string | null;
}

/**
 * Turn the raw correspondence log into disputes. NCQP has no dispute-status API;
 * each case is reconstructed from its "Customer Case Created Confirmation" (filed)
 * and "Case Updated" (agency responded) records plus any attached vehicle image,
 * grouped by the case number embedded in the message text. Only the derived fields
 * are returned — the raw HTML bodies never leave the service. Newest case first.
 */
export function parseDisputes(rows: NcqpCorrespondence[]): Dispute[] {
  const drafts = new Map<string, Draft>();

  const draftFor = (caseNumber: string): Draft => {
    let draft = drafts.get(caseNumber);
    if (!draft) {
      draft = {
        caseNumber,
        createdDate: null,
        updatedDate: null,
        status: 'Filed',
        decisionNotes: null,
        lastUpdated: null,
        attachmentDocumentId: null,
      };
      drafts.set(caseNumber, draft);
    }
    return draft;
  };

  for (const row of rows) {
    const displayName = row.displayName ?? '';
    const timestamp = row.timestamp ?? null;

    // Attached vehicle image: displayName like "1322705.png", stored as a tracer-ticket document.
    if (row.fileLocation === 'TracerTicketDocument' && /\.png$/i.test(displayName)) {
      const num = /(\d+)\.png$/i.exec(displayName);
      if (num && num[1] && row.documentID != null) {
        draftFor(num[1]).attachmentDocumentId = String(row.documentID);
      }
      continue;
    }

    const text = stripHtml(row.emailText ?? row.webAlertText ?? '');
    const caseNumber = caseNumberFrom(text);
    if (!caseNumber) continue;

    if (displayName === CREATED) {
      const draft = draftFor(caseNumber);
      if (!draft.createdDate || (timestamp && timestamp < draft.createdDate)) {
        draft.createdDate = timestamp;
      }
    } else if (displayName === UPDATED) {
      const draft = draftFor(caseNumber);
      // Keep only the most recent update's status/notes.
      if (!draft.updatedDate || (timestamp && timestamp > draft.updatedDate)) {
        draft.updatedDate = timestamp;
        draft.status = firstMatch(text, /Case Status:\s*([A-Za-z]+)/i) ?? 'Open';
        draft.lastUpdated =
          firstMatch(text, /Case Last Updated:\s*([0-9/:\s APM]+?)(?:Case Notes|$)/i) ?? timestamp;
        draft.decisionNotes = firstMatch(
          text,
          /Case Notes:\s*([\s\S]*?)(?:\s*(?:Thank you for your business|Best regards|Sincerely)\b|$)/i,
        );
      }
    }
  }

  return Array.from(drafts.values())
    .map((draft) => ({
      caseNumber: draft.caseNumber,
      createdDate: draft.createdDate,
      status: draft.status,
      decision: decisionFrom(draft.status, draft.decisionNotes),
      decisionNotes: draft.decisionNotes,
      lastUpdated: draft.lastUpdated,
      attachmentDocumentId: draft.attachmentDocumentId,
    }))
    .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? ''));
}
