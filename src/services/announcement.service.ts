import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';
import { emailConfig } from '@config/email';
import cloudinary from '@config/cloudinary';
import { announcementEmailTemplate, announcementEmailText } from '../templates/announcementEmail';

const ANNOUNCEMENT_FROM = 'Kerala Association of Connecticut <announcement@kactusa.org>';
const BATCH_SIZE = 50;
const ATTACHMENT_FOLDER = 'kact/announcements';

export type AnnouncementRecipients = 'users' | 'members' | 'both';

export interface AnnouncementImageAttachment {
  url: string;
  filename: string;
}

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

  private uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: ATTACHMENT_FOLDER, resource_type: 'image', use_filename: true, unique_filename: true },
        (error: unknown, result: { secure_url?: string } | undefined) => {
          if (error || !result?.secure_url) {
            reject(error || new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result.secure_url);
        }
      );
      stream.end(file.buffer);
    });
  }

  async sendAnnouncement(
    subject: string,
    body: string,
    recipients: AnnouncementRecipients,
    files: Express.Multer.File[] = []
  ): Promise<AnnouncementResult> {
    const imageFiles = files.filter((f) => f.mimetype.startsWith('image/'));
    const pdfFiles = files.filter((f) => f.mimetype === 'application/pdf');

    // Upload images to Cloudinary for inline embedding
    const inlineImages: AnnouncementImageAttachment[] = await Promise.all(
      imageFiles.map(async (file) => ({
        url: await this.uploadToCloudinary(file),
        filename: file.originalname,
      }))
    );

    // PDFs stay as buffers — sent directly as Resend attachments (no Cloudinary)
    // Images are also added as Resend attachments so recipients can download them
    const resendAttachments = [
      ...imageFiles.map((file) => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: file.mimetype as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
      })),
      ...pdfFiles.map((file) => ({
        filename: file.originalname,
        content: file.buffer,
        contentType: 'application/pdf' as const,
      })),
    ];

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

    const allEmails = Array.from(emailSet);
    const totalRecipients = allEmails.length;
    let sentCount = 0;
    let failedCount = 0;

    if (totalRecipients === 0) {
      return { totalRecipients: 0, sentCount: 0, failedCount: 0 };
    }

    const html = announcementEmailTemplate(subject, body, inlineImages);
    const text = announcementEmailText(subject, body);

    // Send individual emails in parallel batches so each recipient sees only their own address in To
    for (let i = 0; i < allEmails.length; i += BATCH_SIZE) {
      const batch = allEmails.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((email) =>
          this.resend.emails.send({
            from: ANNOUNCEMENT_FROM,
            to: email,
            subject,
            html,
            text,
            ...(resendAttachments.length > 0 && { attachments: resendAttachments }),
          })
        )
      );
      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled') {
          const { data, error } = result.value;
          if (error) {
            failedCount++;
            console.error(`[Announcement] Resend API error for ${batch[j]}:`, error);
          } else {
            sentCount++;
            console.log(`[Announcement] Sent to ${batch[j]}, id=${data?.id}`);
          }
        } else {
          failedCount++;
          console.error(`[Announcement] Failed to send to ${batch[j]}:`, result.reason);
        }
      }
      console.log(`✉️  Announcement batch processed: ${batch.length} recipients (offset ${i})`);
    }

    return { totalRecipients, sentCount, failedCount };
  }
}
