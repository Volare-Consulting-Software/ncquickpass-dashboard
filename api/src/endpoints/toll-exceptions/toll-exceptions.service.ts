import { Injectable } from '@nestjs/common';
import { NcqpAccountClient } from '../ncqp/ncqp-account.client';
import { NcqpCasesClient } from '../ncqp/ncqp-cases.client';
import { NcqpSession } from '../auth/session/session';
import { CreateDisputeDto } from '../../models/tollExceptions/CreateDisputeDto';
import { Dispute, parseDisputes } from './dispute-correspondence';

/** A dispute reason offered to the customer. */
export interface DisputeReasonView {
  reasonId: number;
  label: string;
}

/** Result of filing a dispute. */
export interface CreateDisputeResult {
  caseNumber: string;
  caseId: number;
}

/** A correspondence document ready to stream to the client. */
export interface DisputeDocument {
  data: Buffer;
  contentType: string;
  filename: string;
}

/**
 * Customer-facing dispute reason ids, in display order — the full NCQP list also
 * carries internal/agency-only reasons (IAG, judicial/admin review) we don't
 * offer. The first id is the default the drawer pre-selects.
 */
const CUSTOMER_REASON_IDS = [43, 38, 44, 37, 22, 34, 40];

/** NCQP dispute field values observed via ClickSpec; constant across submissions. */
const DISPUTE_DEFAULTS = {
  priorityLevelID: 2,
  caseStatusId: 1,
  communicationMethodID: 2,
  languagePreference: 0,
  ticketTypeID: 1,
  sourceID: 1,
  biNoticeID: 0,
  updateUserID: 99,
  queueID: 9006,
} as const;

const TOLL_DISPUTE_TOPIC = 'Toll Dispute';
const TOLL_DISPUTE_TOPIC_ID = 63;

@Injectable()
export class TollExceptionsService {
  constructor(
    private readonly account: NcqpAccountClient,
    private readonly cases: NcqpCasesClient,
  ) {}

  /** The customer's disputes with status/decision, parsed from correspondence. */
  async getDisputes(session: NcqpSession): Promise<Dispute[]> {
    const correspondence = await this.account.searchCorrespondence(session.token, session.accountId);
    return parseDisputes(correspondence);
  }

  /** Customer-selectable dispute reasons (curated, default first). */
  async getReasons(session: NcqpSession): Promise<DisputeReasonView[]> {
    const all = await this.cases.getDisputeReasons(session.token);
    const labelById = new Map(all.map((reason) => [reason.reasonID, reason.reason]));
    return CUSTOMER_REASON_IDS.filter((id) => labelById.has(id)).map((id) => ({
      reasonId: id,
      label: labelById.get(id) as string,
    }));
  }

  /**
   * File a dispute for the selected transactions: open a case (tracer ticket) with
   * the chosen reason + comments, then attach the transactions to it.
   */
  async createDispute(session: NcqpSession, dto: CreateDisputeDto): Promise<CreateDisputeResult> {
    const { token, accountId } = session;

    const caseType = await this.cases.getCaseTypeId(token, 'Account Dispute');
    const topic = caseType.caseTopics.find((t) => t.topicName === TOLL_DISPUTE_TOPIC);
    const reasons = await this.cases.getDisputeReasons(token);
    const reason = reasons.find((r) => r.reasonID === dto.reasonId);

    const ticketNumber = await this.cases.generateTicketNumber(token);
    const caseId = await this.cases.createTracerTicket(token, {
      ticketNumber,
      caseTypeId: caseType.id,
      caseTopicId: topic?.id ?? TOLL_DISPUTE_TOPIC_ID,
      caseTitle: reason?.reason ?? 'Toll dispute',
      reasonID: dto.reasonId,
      accountId,
      notes: `Comments: ${dto.comments}`,
      ...DISPUTE_DEFAULTS,
    });

    await this.cases.addCase(token, {
      id: '',
      accountId,
      caseId,
      caseInfos: {
        createdDate: new Date().toISOString(),
        caseTabs: [
          {
            name: 'Transaction Tab',
            data: dto.detailTransactionIds.map((detailTransactionID) => ({ detailTransactionID })),
          },
        ],
      },
    });

    return { caseNumber: ticketNumber, caseId };
  }

  /** Fetch a correspondence document (e.g. the attached vehicle image) to stream. */
  getDocument(session: NcqpSession, documentId: string): Promise<DisputeDocument> {
    return this.account.getDocumentStream(session.token, documentId);
  }
}
