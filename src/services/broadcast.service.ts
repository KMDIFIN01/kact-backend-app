import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';
import { emailConfig } from '@config/email';
import cloudinary from '@config/cloudinary';
import { broadcastEmailTemplate, broadcastEmailText } from '../templates/broadcastEmail';

const BROADCAST_FROM = 'Kerala Association of Connecticut <contact@kactusa.org>';
const CONTACT_BATCH_SIZE = 5;
const CONTACT_BATCH_DELAY_MS = 1500; // Increased from 1200ms to respect rate limit
const POST_SYNC_DELAY_MS = 1500; // Delay after contact sync before broadcast creation
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 2000;
const IMAGE_FOLDER = 'kact/broadcasts';

export type BroadcastRecipients = 'users' | 'members' | 'both';

export interface BroadcastResult {
  broadcastId: string;
  totalContacts: number;
}

interface ContactEntry {
  email: string;
  firstName: string;
  lastName: string;
}

export interface BroadcastImageAttachment {
  url: string;
  filename: string;
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

  private uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: IMAGE_FOLDER, resource_type: 'image', use_filename: true, unique_filename: true },
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

  async sendBroadcast(
    subject: string,
    body: string,
    recipients: BroadcastRecipients = 'both',
    files: Express.Multer.File[] = []
  ): Promise<BroadcastResult> {
    // Upload images to Cloudinary for inline embedding
    const inlineImages: BroadcastImageAttachment[] = await Promise.all(
      files.map(async (file) => ({
        url: await this.uploadToCloudinary(file),
        filename: file.originalname,
      }))
    );

    // Collect users and/or members from DB based on recipient selection
    let users: { email: string; firstName: string | null; lastName: string | null }[] = [];
    let members: { email: string; firstName: string; lastName: string }[] = [];

    if (recipients === 'users' || recipients === 'both') {
      users = await this.prisma.user.findMany({ select: { email: true, firstName: true, lastName: true } });
    }
    if (recipients === 'members' || recipients === 'both') {
      members = await this.prisma.membership.findMany({ select: { email: true, firstName: true, lastName: true } });
    }

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

    console.log(`[Broadcast] Preparing to send "${subject}" to ${totalContacts} recipients (audience: ${recipients})`);
    console.log(`[Broadcast] Email list:\n${contacts.map((c) => c.email).join('\n')}`);

    // Sync contacts to Resend Audience
    console.log(`[Broadcast] Syncing ${totalContacts} contacts to Resend segment...`);
    await this.syncContactsToAudience(contacts);
    console.log(`[Broadcast] Contact sync complete`);

    // Add delay after sync to avoid rate limit on broadcast creation
    console.log(`[Broadcast] Waiting ${POST_SYNC_DELAY_MS}ms before creating broadcast to respect rate limits...`);
    await this.delay(POST_SYNC_DELAY_MS);
    console.log(`[Broadcast] Proceeding with broadcast creation`);

    // Build HTML and text
    const html = broadcastEmailTemplate(subject, body, inlineImages);
    const text = broadcastEmailText(body);

    // Create and send the broadcast with retry logic for rate limit resilience
    let createResult: Awaited<ReturnType<typeof this.resend.broadcasts.create>> | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`[Broadcast] Creating broadcast (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})...`);
        createResult = await this.resend.broadcasts.create({
          segmentId: this.segmentId,
          from: BROADCAST_FROM,
          replyTo: 'contact@kactusa.org',
          subject,
          html,
          text,
          send: true,
        } as Parameters<typeof this.resend.broadcasts.create>[0]);

        if (createResult.error) {
          throw new Error(createResult.error.message ?? 'Failed to create broadcast');
        }

        // Success - break out of retry loop
        break;
      } catch (error) {
        lastError = error as Error;
        const isRateLimitError = lastError.message.toLowerCase().includes('rate limit') ||
                                 lastError.message.toLowerCase().includes('too many requests');

        console.error(`[Broadcast] Attempt ${attempt}/${MAX_RETRY_ATTEMPTS} failed: ${lastError.message}`);

        if (attempt < MAX_RETRY_ATTEMPTS && isRateLimitError) {
          const retryDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`[Broadcast] Rate limit detected. Retrying in ${retryDelay}ms...`);
          await this.delay(retryDelay);
        } else {
          // Last attempt or non-rate-limit error - throw
          break;
        }
      }
    }

    if (!createResult || createResult.error || !createResult.data?.id) {
      throw new Error(lastError?.message ?? createResult?.error?.message ?? 'Failed to create broadcast');
    }

    const broadcastId = createResult.data.id;
    console.log(`[Broadcast] Broadcast created and queued, id=${broadcastId}, recipients=${totalContacts}`);

    return { broadcastId, totalContacts };
  }
}
