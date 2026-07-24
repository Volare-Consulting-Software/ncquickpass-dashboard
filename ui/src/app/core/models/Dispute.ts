/** How the agency resolved a dispute. */
export type DisputeDecision = 'under_review' | 'denied' | 'approved';

/** A customer dispute with its current status and agency response. */
export interface Dispute {
  caseNumber: string;
  createdDate: string | null;
  /** Raw case status label: "Filed", "Open", or "Closed". */
  status: string;
  decision: DisputeDecision;
  decisionNotes: string | null;
  lastUpdated: string | null;
  /** documentID of the attached vehicle image, if any. */
  attachmentDocumentId: string | null;
}
