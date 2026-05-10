import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';
import { emailConfig } from '@config/email';
import { broadcastEmailTemplate, broadcastEmailText } from '../templates/broadcastEmail';

const BROADCAST_FROM = 'Kerala Association of Connecticut <announcement@kactusa.org>';
const CONTACT_BATCH_SIZE = 5;
const CONTACT_BATCH_DELAY_MS = 1200;

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
    if (!this.segmentId) {
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

    // Sync contacts to Resend Audience
    await this.syncContactsToAudience(contacts);

    // Build HTML and text
    const html = broadcastEmailTemplate(subject, body);
    const text = broadcastEmailText(body);

    // Create and send the broadcast in one step
    const createResult = await this.resend.broadcasts.create({
      segmentId: this.segmentId,
      from: BROADCAST_FROM,
      subject,
      html,
      text,
      send: true,
    } as Parameters<typeof this.resend.broadcasts.create>[0]);

    if (createResult.error || !createResult.data?.id) {
      throw new Error(createResult.error?.message ?? 'Failed to create broadcast');
    }

    const broadcastId = createResult.data.id;

    return { broadcastId, totalContacts };
  }
}
