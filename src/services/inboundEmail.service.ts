import crypto from 'crypto';
import { Resend } from 'resend';
import prisma from '@config/database';
import { emailConfig } from '@config/email';
import { EmailDirection } from '@prisma/client';

// ---------------------------------------------------------------------------
// Types matching the Resend email.received webhook payload
// NOTE: Resend webhooks contain ONLY metadata — html, text, headers, and
//       attachment content are NOT included. They must be fetched separately
//       via resend.emails.receiving.get(email_id).
// ---------------------------------------------------------------------------

/** Attachment metadata as delivered in the webhook payload. */
export interface ResendInboundAttachmentMeta {
  /** Resend attachment id — used to retrieve content separately. */
  id: string;
  filename: string;
  content_type: string;
  content_disposition?: string;
  content_id?: string;
}

export interface ResendEmailReceivedData {
  email_id: string;
  created_at: string;
  from: string;
  to: string[];
  bcc?: string[];
  cc?: string[];
  message_id?: string;
  subject: string;
  /** Attachment metadata only — no content in webhook. */
  attachments?: ResendInboundAttachmentMeta[];
}

export interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: ResendEmailReceivedData;
}

/** Shape returned by resend.emails.receiving.get() */
interface ReceivedEmailContent {
  html?: string | null;
  text?: string | null;
  headers?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Thread key generation
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
  private resend: Resend;

  constructor() {
    this.resend = new Resend(emailConfig.apiKey);
  }

  /**
   * Process a validated Resend email.received webhook payload.
   * Fetches full HTML/text content via the Receiving API before persisting.
   * Idempotent: duplicate replays are safely ignored via providerMessageId uniqueness.
   */
  async handleEmailReceived(payload: ResendWebhookPayload): Promise<{ messageId: string; threadId: string; isDuplicate: boolean }> {
    if (payload.type !== 'email.received') {
      console.info('[InboundEmail] Ignoring non-inbound event type:', payload.type);
      return { messageId: '', threadId: '', isDuplicate: false };
    }

    const { data } = payload;

    // Idempotency: check by Resend's email_id
    const existing = await prisma.emailMessage.findUnique({
      where: { providerMessageId: data.email_id },
      select: { id: true, threadId: true },
    });
    if (existing) {
      console.info('[InboundEmail] Duplicate event ignored, email_id:', data.email_id);
      return { messageId: existing.id, threadId: existing.threadId, isDuplicate: true };
    }

    // ------------------------------------------------------------------
    // Fetch full email content — webhook only has metadata, not body/html.
    // See: https://resend.com/docs/dashboard/receiving/get-email-content
    // ------------------------------------------------------------------
    let htmlBody: string | null = null;
    let textBody: string | null = null;
    try {
      const { data: content, error } = await (this.resend.emails as unknown as {
        receiving: { get(id: string): Promise<{ data: ReceivedEmailContent | null; error: unknown }> };
      }).receiving.get(data.email_id);

      if (error) {
        console.warn('[InboundEmail] Could not fetch email content from Receiving API:', error);
      } else if (content) {
        htmlBody = content.html ?? null;
        textBody = content.text ?? null;
      }
    } catch (err) {
      // Non-fatal — store the message without body so thread still appears
      console.warn('[InboundEmail] Receiving API call failed, storing without body:', err);
    }

    // Collect participants for thread key
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
        providerMessageId: data.email_id,
        fromAddress: data.from,
        toAddresses: data.to ?? [],
        ccAddresses: data.cc ?? [],
        subject: data.subject ?? '',
        textBody,
        htmlBody,
        receivedAt: new Date(data.created_at || payload.created_at),
        attachments: {
          create: (data.attachments ?? []).map((att) => ({
            filename: att.filename,
            contentType: att.content_type,
            size: 0, // size not provided in webhook metadata
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
