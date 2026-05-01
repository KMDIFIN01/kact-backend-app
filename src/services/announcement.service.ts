import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';
import { emailConfig } from '@config/email';
import { announcementEmailTemplate, announcementEmailText } from '../templates/announcementEmail';

const ANNOUNCEMENT_FROM = 'KACT Announcements <announcement@kactusa.org>';
const BCC_CHUNK_SIZE = 50;

// TODO: Remove after testing — overrides all recipients with test addresses
const TEST_RECIPIENTS: string[] | null = ['kmdifin01@gmail.com', 'difinmathew@gmail.com'];

export type AnnouncementRecipients = 'users' | 'members' | 'both';

export interface AnnouncementResult {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
}

export class AnnouncementService {
  private resend: Resend;
  private prisma: PrismaClient;

  constructor() {
    this.resend = new Resend(emailConfig.apiKey);
    this.prisma = new PrismaClient();
  }

  async sendAnnouncement(
    subject: string,
    body: string,
    recipients: AnnouncementRecipients
  ): Promise<AnnouncementResult> {
    const emailSet = new Set<string>();

    if (recipients === 'users' || recipients === 'both') {
      const users = await this.prisma.user.findMany({ select: { email: true } });
      for (const u of users) {
        emailSet.add(u.email.toLowerCase());
      }
    }

    if (recipients === 'members' || recipients === 'both') {
      const memberships = await this.prisma.membership.findMany({ select: { email: true } });
      for (const m of memberships) {
        emailSet.add(m.email.toLowerCase());
      }
    }

    const allEmails = TEST_RECIPIENTS ?? Array.from(emailSet);
    const totalRecipients = allEmails.length;
    let sentCount = 0;
    let failedCount = 0;

    if (totalRecipients === 0) {
      return { totalRecipients: 0, sentCount: 0, failedCount: 0 };
    }

    const html = announcementEmailTemplate(subject, body);
    const text = announcementEmailText(subject, body);

    // Send individual emails in parallel batches so each recipient sees only their own address in To
    for (let i = 0; i < allEmails.length; i += BCC_CHUNK_SIZE) {
      const batch = allEmails.slice(i, i + BCC_CHUNK_SIZE);
      const results = await Promise.allSettled(
        batch.map((email) =>
          this.resend.emails.send({
            from: ANNOUNCEMENT_FROM,
            to: email,
            subject,
            html,
            text,
          })
        )
      );
      for (const result of results) {
        if (result.status === 'fulfilled') {
          sentCount++;
        } else {
          failedCount++;
          console.error('Failed to send announcement to recipient:', result.reason);
        }
      }
      console.log(`✉️  Announcement batch sent: ${batch.length} recipients (offset ${i})`);
    }

    return { totalRecipients, sentCount, failedCount };
  }
}
