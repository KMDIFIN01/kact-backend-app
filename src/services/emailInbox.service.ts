import { Resend } from 'resend';
import prisma from '@config/database';
import { emailConfig } from '@config/email';
import { EmailDirection } from '@prisma/client';

/** Shape returned by resend.emails.receiving.get() */
interface ReceivedEmailContent {
  html?: string | null;
  text?: string | null;
  headers?: Record<string, string>;
}

type ResendReceiving = {
  receiving: { get(id: string): Promise<{ data: ReceivedEmailContent | null; error: unknown }> };
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SendReplyInput {
  threadId: string;
  toAddresses: string[];
  ccAddresses?: string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class EmailInboxService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(emailConfig.apiKey);
  }

  /** List threads ordered by most recent message first. */
  async listThreads(options: { page: number; limit: number; unreadOnly?: boolean }) {
    const { page, limit, unreadOnly } = options;
    const skip = (page - 1) * limit;

    const where = unreadOnly ? { isRead: false } : {};

    const [threads, total] = await Promise.all([
      prisma.emailThread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip,
        take: limit,
        include: {
          messages: {
            orderBy: { receivedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              direction: true,
              fromAddress: true,
              subject: true,
              textBody: true,
              receivedAt: true,
            },
          },
        },
      }),
      prisma.emailThread.count({ where }),
    ]);

    return { threads, total, page, limit };
  }

  /** Retrieve a full thread with all messages and attachments. */
  async getThread(threadId: string) {
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          orderBy: { receivedAt: 'asc' },
          include: {
            attachments: true,
          },
        },
      },
    });

    if (!thread) return null;

    // Lazy-fetch content for any INBOUND messages that have null bodies.
    // This handles emails received before the Receiving API fetch was added,
    // as well as any retry scenarios.
    const nullBodyMessages = thread.messages.filter(
      (m) => m.direction === EmailDirection.INBOUND && m.textBody === null && m.htmlBody === null && m.providerMessageId
    );

    if (nullBodyMessages.length > 0) {
      const receiving = (this.resend.emails as unknown as ResendReceiving).receiving;
      await Promise.all(
        nullBodyMessages.map(async (msg) => {
          try {
            const { data: content, error } = await receiving.get(msg.providerMessageId as string);
            if (error || !content) {
              console.warn('[EmailInbox] Could not fetch content for message', msg.id, error);
              return;
            }
            const htmlBody = content.html ?? null;
            const textBody = content.text ?? null;
            if (htmlBody !== null || textBody !== null) {
              await prisma.emailMessage.update({
                where: { id: msg.id },
                data: { htmlBody, textBody },
              });
              // Update in-place so the returned thread has real content
              msg.htmlBody = htmlBody;
              msg.textBody = textBody;
            }
          } catch (err) {
            console.warn('[EmailInbox] Failed to backfill content for message', msg.id, err);
          }
        })
      );
    }

    // Mark as read when admin opens the thread
    if (!thread.isRead) {
      await prisma.emailThread.update({
        where: { id: threadId },
        data: { isRead: true },
      });
    }

    return thread;
  }

  /** Send a reply via Resend and store the outbound message in the thread. */
  async sendReply(input: SendReplyInput): Promise<{ messageId: string }> {
    const thread = await prisma.emailThread.findUnique({ where: { id: input.threadId } });
    if (!thread) {
      throw new Error(`Thread ${input.threadId} not found`);
    }

    // Use configured reply email (e.g., contact@kactusa.org) for inbox replies
    const replyFromEmail = emailConfig.replyEmail;
    const fromField = `${emailConfig.fromName} <${replyFromEmail}>`;

    const sendResult = await this.resend.emails.send({
      from: fromField,
      to: input.toAddresses,
      cc: input.ccAddresses ?? [],
      subject: input.subject,
      text: input.textBody ?? '',
      html: input.htmlBody ?? '',
    });

    if (sendResult.error) {
      throw new Error(`Resend send error: ${sendResult.error.message}`);
    }

    const message = await prisma.emailMessage.create({
      data: {
        threadId: thread.id,
        direction: EmailDirection.OUTBOUND,
        providerMessageId: sendResult.data?.id ?? null,
        fromAddress: replyFromEmail,
        toAddresses: input.toAddresses,
        ccAddresses: input.ccAddresses ?? [],
        subject: input.subject,
        textBody: input.textBody ?? null,
        htmlBody: input.htmlBody ?? null,
      },
    });

    await prisma.emailThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    });

    console.info(`[EmailInbox] Reply sent, Resend id: ${sendResult.data?.id}, stored as message ${message.id}`);
    return { messageId: message.id };
  }

  /** Delete a thread and all its messages (cascade). */
  async deleteThread(threadId: string): Promise<void> {
    await prisma.emailThread.delete({ where: { id: threadId } });
  }

  /** Mark a thread as read/unread. */
  async markThread(threadId: string, isRead: boolean): Promise<void> {
    await prisma.emailThread.update({ where: { id: threadId }, data: { isRead } });
  }
}
