import prisma from '@config/database';
import { NotFoundError, BadRequestError } from '@utils/errors';
import { PaymentType, SponsorshipStatus } from '../types/api';

interface CreateSponsorshipInput {
  businessName: string;
  businessType: string;
  websiteUrl?: string;
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

export class SponsorshipService {
  /**
   * Create a new sponsorship application
   */
  async createSponsorship(data: CreateSponsorshipInput) {
    const sponsorship = await prisma.sponsorship.create({
      data: {
        businessName: data.businessName,
        businessType: data.businessType,
        websiteUrl: data.websiteUrl || null,
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
        approvedBy: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return sponsorship;
  }

  /**
   * Get all sponsorship applications
   */
  async getAllSponsorships() {
    const sponsorships = await prisma.sponsorship.findMany({
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
