import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';
import { emailConfig } from '@config/email';
import { broadcastEmailTemplate, broadcastEmailText } from '../templates/broadcastEmail';

const BROADCAST_FROM = 'Kerala Association of Connecticut <contact@kactusa.org>';
const CONTACT_BATCH_SIZE = 5;
const CONTACT_BATCH_DELAY_MS = 1200;
const TEST_BROADCAST_RECIPIENTS = ['kmdifin01@gmail.com'] as const;
const BROADCAST_TEST_MODE = true;

export interface BroadcastResult {
  broadcastId: string;
  totalContacts: number;
}

interface ContactEntry {
  email: string;
  firstName: string;
  lastName: string;
}

export class BroadcastService {
  private resend: Resend;
  private prisma: PrismaClient;
  private segmentId: string;

  constructor() {
    this.resend = new Resend(emailConfig.apiKey);
    this.prisma = new PrismaClient();
    this.segmentId = process.env.RESEND_SEGMENT_ID ?? '';
    if (!BROADCAST_TEST_MODE && !this.segmentId) {
      throw new Error('RESEND_SEGMENT_ID environment variable is not set');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async syncContactsToAudience(contacts: ContactEntry[]): Promise<void> {
    for (let i = 0; i < contacts.length; i += CONTACT_BATCH_SIZE) {
      const batch = contacts.slice(i, i + CONTACT_BATCH_SIZE);
      await Promise.allSettled(
        batch.map((c) =>
          this.resend.contacts.create({
            audienceId: this.segmentId,
            email: c.email,
            firstName: c.firstName,
            lastName: c.lastName,
            unsubscribed: false,
          })
        )
      );
      if (i + CONTACT_BATCH_SIZE < contacts.length) {
        await this.delay(CONTACT_BATCH_DELAY_MS);
      }
    }
  }

  async sendBroadcast(subject: string, body: string): Promise<BroadcastResult> {
    if (BROADCAST_TEST_MODE) {
      const html = broadcastEmailTemplate(subject, body);
      const text = broadcastEmailText(body);

      console.log(
        `[Broadcast][Test Mode] Sending "${subject}" only to: ${TEST_BROADCAST_RECIPIENTS.join(', ')}`
      );

      const sendResults = await Promise.allSettled(
        TEST_BROADCAST_RECIPIENTS.map((email) =>
          this.resend.emails.send({
            from: BROADCAST_FROM,
            to: email,
            replyTo: 'mykact@gmail.com',
            subject,
            html,
            text,
          })
        )
      );

      const failed = sendResults.filter((result) => {
        if (result.status === 'rejected') {
          return true;
        }

        return !!result.value.error;
      }).length;

      if (failed === TEST_BROADCAST_RECIPIENTS.length) {
        throw new Error('Failed to send test broadcast emails');
      }

      return {
        broadcastId: `test-broadcast-${Date.now()}`,
        totalContacts: TEST_BROADCAST_RECIPIENTS.length,
      };
    }

    // Collect all users and members from DB
    const [users, members] = await Promise.all([
      this.prisma.user.findMany({ select: { email: true, firstName: true, lastName: true } }),
      this.prisma.membership.findMany({ select: { email: true, firstName: true, lastName: true } }),
    ]);

    // Deduplicate by email (case-insensitive), users take precedence for name data
    const contactMap = new Map<string, ContactEntry>();
    for (const m of members) {
      contactMap.set(m.email.toLowerCase(), {
        email: m.email.toLowerCase(),
        firstName: m.firstName,
        lastName: m.lastName,
      });
    }
    for (const u of users) {
      contactMap.set(u.email.toLowerCase(), {
        email: u.email.toLowerCase(),
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
      });
    }

    const contacts = Array.from(contactMap.values());
    const totalContacts = contacts.length;

    if (totalContacts === 0) {
      throw new Error('No recipients found to send broadcast to');
    }

    console.log(`[Broadcast] Preparing to send "${subject}" to ${totalContacts} recipients`);
    console.log(`[Broadcast] Email list:\n${contacts.map((c) => c.email).join('\n')}`);

    // Sync contacts to Resend Audience
    console.log(`[Broadcast] Syncing ${totalContacts} contacts to Resend segment...`);
    await this.syncContactsToAudience(contacts);
    console.log(`[Broadcast] Contact sync complete`);

    // Build HTML and text
    const html = broadcastEmailTemplate(subject, body);
    const text = broadcastEmailText(body);

    // Create and send the broadcast in one step
    const createResult = await this.resend.broadcasts.create({
      segmentId: this.segmentId,
      from: BROADCAST_FROM,
      replyTo: 'mykact@gmail.com',
      subject,
      html,
      text,
      send: true,
    } as Parameters<typeof this.resend.broadcasts.create>[0]);

    if (createResult.error || !createResult.data?.id) {
      throw new Error(createResult.error?.message ?? 'Failed to create broadcast');
    }

    const broadcastId = createResult.data.id;
    console.log(`[Broadcast] Broadcast created and queued, id=${broadcastId}, recipients=${totalContacts}`);

    return { broadcastId, totalContacts };
  }
}
