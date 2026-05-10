import crypto from 'crypto';
import prisma from '@config/database';
import { EmailDirection } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types matching the Resend email.received webhook payload
// ---------------------------------------------------------------------------

export interface ResendInboundAttachment {
  filename: string;
  content?: string; // base64
  contentType: string;
  size?: number;
}

export interface ResendEmailReceivedData {
  email_id?: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: ResendInboundAttachment[];
  headers?: Record<string, string>;
}

export interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: ResendEmailReceivedData;
}

// ---------------------------------------------------------------------------
// Thread key generation
// Subject + sorted participant set → deterministic SHA-256 key
// ---------------------------------------------------------------------------

const SUBJECT_PREFIX_RE = /^((re|fwd|fw)\s*:\s*)*/i;

function normalizeSubject(subject: string): string {
  return subject.replace(SUBJECT_PREFIX_RE, '').trim().toLowerCase();
}

function buildThreadKey(normalizedSubject: string, participants: string[]): string {
  const sorted = [...participants]
    .map((e) => e.toLowerCase().trim())
    .sort()
    .join(',');
  return crypto
    .createHash('sha256')
    .update(`${normalizedSubject}:${sorted}`)
    .digest('hex');
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class InboundEmailService {
  /**
   * Process a validated Resend email.received webhook payload.
   * Idempotent: duplicate webhook replays are safely ignored via providerMessageId uniqueness.
   *
   * @returns The persisted EmailMessage id.
   */
  async handleEmailReceived(payload: ResendWebhookPayload): Promise<{ messageId: string; threadId: string; isDuplicate: boolean }> {
    if (payload.type !== 'email.received') {
      console.info('[InboundEmail] Ignoring non-inbound event type:', payload.type);
      return { messageId: '', threadId: '', isDuplicate: false };
    }

    const { data } = payload;

    // Idempotency: check by Resend's email_id if present
    if (data.email_id) {
      const existing = await prisma.emailMessage.findUnique({
        where: { providerMessageId: data.email_id },
        select: { id: true, threadId: true },
      });
      if (existing) {
        console.info('[InboundEmail] Duplicate event ignored, email_id:', data.email_id);
        return { messageId: existing.id, threadId: existing.threadId, isDuplicate: true };
      }
    }

    // Collect all participants for thread key
    const participants = [data.from, ...(data.to ?? []), ...(data.cc ?? [])];
    const normalizedSubject = normalizeSubject(data.subject ?? '');
    const threadKey = buildThreadKey(normalizedSubject, participants);

    // Find or create thread
    const thread = await prisma.emailThread.upsert({
      where: { threadKey },
      update: { lastMessageAt: new Date() },
      create: {
        subject: normalizedSubject || data.subject,
        threadKey,
        participants,
        isRead: false,
        lastMessageAt: new Date(),
      },
    });

    // Persist the message
    const message = await prisma.emailMessage.create({
      data: {
        threadId: thread.id,
        direction: EmailDirection.INBOUND,
        providerMessageId: data.email_id ?? null,
        fromAddress: data.from,
        toAddresses: data.to ?? [],
        ccAddresses: data.cc ?? [],
        subject: data.subject ?? '',
        textBody: data.text ?? null,
        htmlBody: data.html ?? null,
        receivedAt: new Date(payload.created_at) || new Date(),
        attachments: {
          create: (data.attachments ?? []).map((att) => ({
            filename: att.filename,
            contentType: att.contentType,
            size: att.size ?? 0,
          })),
        },
      },
    });

    console.info(
      `[InboundEmail] Stored message ${message.id} in thread ${thread.id} (key: ${threadKey})`
    );

    return { messageId: message.id, threadId: thread.id, isDuplicate: false };
  }
}
