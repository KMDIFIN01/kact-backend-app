import prisma from '@config/database';
import cloudinary from '@config/cloudinary';
import { NotFoundError, BadRequestError } from '@utils/errors';
import { PaymentType, SponsorshipStatus } from '../types/api';
import { EmailService } from './email.service';

interface CreateSponsorshipInput {
  businessName: string;
  businessType: string;
  websiteUrl?: string;
  imageUrl?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  sponsorshipType: string;
  paymentType: PaymentType;
  notes?: string;
}

interface UpdateSponsorshipStatusInput {
  id: string;
  sponsorshipStatus: SponsorshipStatus;
  approvedBy: string;
}

const SPONSORSHIP_FOLDER = process.env.SPONSORSHIP_CLOUDINARY_FOLDER || 'kact/sponsorship';

const selectFields = {
  id: true,
  businessName: true,
  businessType: true,
  websiteUrl: true,
  imageUrl: true,
  firstName: true,
  lastName: true,
  email: true,
  phoneNumber: true,
  address1: true,
  address2: true,
  city: true,
  state: true,
  zip: true,
  sponsorshipType: true,
  paymentType: true,
  sponsorshipStatus: true,
  applicationDate: true,
  approvedDate: true,
  approvedBy: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
};

export class SponsorshipService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Create a new sponsorship application
   */
  async createSponsorship(data: CreateSponsorshipInput) {
    const sponsorship = await prisma.sponsorship.create({
      data: {
        businessName: data.businessName,
        businessType: data.businessType,
        websiteUrl: data.websiteUrl || null,
        imageUrl: data.imageUrl || null,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address1: data.address1,
        address2: data.address2 || null,
        city: data.city,
        state: data.state,
        zip: data.zip,
        sponsorshipType: data.sponsorshipType,
        paymentType: data.paymentType,
        notes: data.notes || null,
      },
      select: selectFields,
    });

    // Send application submitted email
    await this.emailService.sendApplicationSubmittedEmail(
      data.email,
      `${data.firstName} ${data.lastName}`,
      'sponsorship'
    );

    return sponsorship;
  }

  /**
   * Get all sponsorship applications
   */
  async getAllSponsorships() {
    const sponsorships = await prisma.sponsorship.findMany({
      orderBy: { applicationDate: 'desc' },
      select: {
        ...selectFields,
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sponsorships;
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestError('An image file is required');
    }

    return this.uploadToCloudinary(file);
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(imageUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
    }
  }

  private uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    const folder = SPONSORSHIP_FOLDER;

    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', use_filename: true, unique_filename: true },
        (error: unknown, result: { secure_url?: string } | undefined) => {
          if (error) {
            reject(new BadRequestError('Failed to upload image to Cloudinary'));
            return;
          }

          if (!result?.secure_url) {
            reject(new BadRequestError('Failed to get upload URL from Cloudinary'));
            return;
          }

          resolve(result.secure_url);
        }
      );

      stream.end(file.buffer);
    });
  }

  private extractPublicId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const uploadIndex = parsed.pathname.indexOf('/upload/');
      if (uploadIndex === -1) return null;
      const afterUpload = parsed.pathname.substring(uploadIndex + '/upload/'.length);
      const withoutVersion = afterUpload.replace(/^v\d+\//, '');
      return withoutVersion.replace(/\.[^.]+$/, '') || null;
    } catch {
      return null;
    }
  }

  /**
   * Update sponsorship status (approve/reject/expire)
   */
  async updateSponsorshipStatus({ id, sponsorshipStatus, approvedBy }: UpdateSponsorshipStatusInput) {
    const existingSponsorship = await prisma.sponsorship.findUnique({
      where: { id },
    });

    if (!existingSponsorship) {
      throw new NotFoundError('Sponsorship not found');
    }

    if (sponsorshipStatus === 'PENDING') {
      throw new BadRequestError('Cannot set status back to PENDING');
    }

    const updateData: any = {
      sponsorshipStatus,
    };

    if (sponsorshipStatus === 'APPROVED' || sponsorshipStatus === 'REJECTED') {
      updateData.approvedDate = new Date();
      updateData.approvedBy = approvedBy;
    }

    const updatedSponsorship = await prisma.sponsorship.update({
      where: { id },
      data: updateData,
      select: {
        ...selectFields,
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send status notification email for APPROVED or REJECTED
    if (sponsorshipStatus === 'APPROVED' || sponsorshipStatus === 'REJECTED') {
      await this.emailService.sendApplicationStatusEmail(
        updatedSponsorship.email,
        `${updatedSponsorship.firstName} ${updatedSponsorship.lastName}`,
        'sponsorship',
        sponsorshipStatus as 'APPROVED' | 'REJECTED'
      );
    }

    return updatedSponsorship;
  }

  /**
   * Bulk update sponsorship status for multiple sponsorships
   */
  async bulkUpdateSponsorshipStatus(ids: string[], sponsorshipStatus: SponsorshipStatus, approvedBy: string) {
    if (sponsorshipStatus === 'PENDING') {
      throw new BadRequestError('Cannot set status back to PENDING');
    }

    const updateData: any = {
      sponsorshipStatus,
    };

    if (sponsorshipStatus === 'APPROVED' || sponsorshipStatus === 'REJECTED') {
      updateData.approvedDate = new Date();
      updateData.approvedBy = approvedBy;
    }

    const result = await prisma.sponsorship.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: updateData,
    });

    const updatedSponsorships = await prisma.sponsorship.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        websiteUrl: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        sponsorshipType: true,
        paymentType: true,
        sponsorshipStatus: true,
        applicationDate: true,
        approvedDate: true,
        notes: true,
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send status notification emails for APPROVED or REJECTED
    if (sponsorshipStatus === 'APPROVED' || sponsorshipStatus === 'REJECTED') {
      for (const sponsorship of updatedSponsorships) {
        await this.emailService.sendApplicationStatusEmail(
          sponsorship.email,
          `${sponsorship.firstName} ${sponsorship.lastName}`,
          'sponsorship',
          sponsorshipStatus as 'APPROVED' | 'REJECTED'
        );
      }
    }

    return {
      count: result.count,
      sponsorships: updatedSponsorships,
    };
  }

  /**
   * Filter sponsorships by status
   */
  async filterByStatus(status: SponsorshipStatus) {
    const sponsorships = await prisma.sponsorship.findMany({
      where: { sponsorshipStatus: status },
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        websiteUrl: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        sponsorshipType: true,
        paymentType: true,
        sponsorshipStatus: true,
        applicationDate: true,
        approvedDate: true,
        notes: true,
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sponsorships;
  }

  /**
   * Filter sponsorships by payment type
   */
  async filterByPaymentType(paymentType: PaymentType) {
    const sponsorships = await prisma.sponsorship.findMany({
      where: { paymentType },
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        websiteUrl: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        sponsorshipType: true,
        paymentType: true,
        sponsorshipStatus: true,
        applicationDate: true,
        approvedDate: true,
        notes: true,
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sponsorships;
  }

  /**
   * Search sponsorships by business name, first name, last name, email, or sponsorship type
   */
  async searchSponsorships(searchTerm: string) {
    const sponsorships = await prisma.sponsorship.findMany({
      where: {
        OR: [
          { businessName: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { sponsorshipType: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        websiteUrl: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        sponsorshipType: true,
        paymentType: true,
        sponsorshipStatus: true,
        applicationDate: true,
        approvedDate: true,
        notes: true,
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sponsorships;
  }

  /**
   * Filter sponsorships by application date range
   */
  async filterByDateRange(startDate: string, endDate: string) {
    const sponsorships = await prisma.sponsorship.findMany({
      where: {
        applicationDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        businessName: true,
        businessType: true,
        websiteUrl: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        sponsorshipType: true,
        paymentType: true,
        sponsorshipStatus: true,
        applicationDate: true,
        approvedDate: true,
        notes: true,
        approvedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return sponsorships;
  }
}
