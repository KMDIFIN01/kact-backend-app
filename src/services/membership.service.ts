import prisma from '@config/database';
import { NotFoundError, BadRequestError } from '@utils/errors';
import { MembershipType, PaymentType, MembershipStatus } from '../types/api';

interface CreateMembershipInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  membershipType: MembershipType;
  paymentType: PaymentType;
  notes?: string;
}

interface UpdateMembershipStatusInput {
  id: string;
  membershipStatus: MembershipStatus;
  approvedBy: string;
}

export class MembershipService {
  /**
   * Create a new membership application
   */
  async createMembership(data: CreateMembershipInput) {
    const membership = await prisma.membership.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address1: data.address1,
        address2: data.address2 || null,
        city: data.city,
        state: data.state,
        zip: data.zip,
        membershipType: data.membershipType,
        paymentType: data.paymentType,
        notes: data.notes || null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        membershipType: true,
        paymentType: true,
        membershipStatus: true,
        applicationDate: true,
        approvedDate: true,
        approvedBy: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return membership;
  }

  /**
   * Get all membership applications
   */
  async getAllMemberships() {
    const memberships = await prisma.membership.findMany({
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        membershipType: true,
        membershipStatus: true,
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

    return memberships;
  }

  /**
   * Update membership status (approve/reject/expire)
   */
  async updateMembershipStatus({ id, membershipStatus, approvedBy }: UpdateMembershipStatusInput) {
    // Check if membership exists
    const existingMembership = await prisma.membership.findUnique({
      where: { id },
    });

    if (!existingMembership) {
      throw new NotFoundError('Membership not found');
    }

    // Validate status transition
    if (membershipStatus === 'PENDING') {
      throw new BadRequestError('Cannot set status back to PENDING');
    }

    const updateData: any = {
      membershipStatus,
    };

    // Set approved date and approvedBy for APPROVED or REJECTED status
    if (membershipStatus === 'APPROVED' || membershipStatus === 'REJECTED') {
      updateData.approvedDate = new Date();
      updateData.approvedBy = approvedBy;
    }

    const updatedMembership = await prisma.membership.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        membershipType: true,
        membershipStatus: true,
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

    return updatedMembership;
  }

  /**
   * Bulk update membership status for multiple memberships
   */
  async bulkUpdateMembershipStatus(ids: string[], membershipStatus: MembershipStatus, approvedBy: string) {
    // Validate status transition
    if (membershipStatus === 'PENDING') {
      throw new BadRequestError('Cannot set status back to PENDING');
    }

    const updateData: any = {
      membershipStatus,
    };

    // Set approved date and approvedBy for APPROVED or REJECTED status
    if (membershipStatus === 'APPROVED' || membershipStatus === 'REJECTED') {
      updateData.approvedDate = new Date();
      updateData.approvedBy = approvedBy;
    }

    // Update multiple memberships at once
    const result = await prisma.membership.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: updateData,
    });

    // Fetch updated memberships with full details
    const updatedMemberships = await prisma.membership.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        membershipType: true,
        membershipStatus: true,
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
      memberships: updatedMemberships,
    };
  }

  /**
   * Filter memberships by status
   */
  async filterByStatus(status: MembershipStatus) {
    const memberships = await prisma.membership.findMany({
      where: { membershipStatus: status },
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        membershipType: true,
        membershipStatus: true,
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

    return memberships;
  }

  /**
   * Filter memberships by payment type
   */
  async filterByPaymentType(paymentType: PaymentType) {
    const memberships = await prisma.membership.findMany({
      where: { paymentType },
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        membershipType: true,
        paymentType: true,
        membershipStatus: true,
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

    return memberships;
  }

  /**
   * Search memberships by first name or last name
   */
  async searchMemberships(searchTerm: string) {
    const memberships = await prisma.membership.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        membershipType: true,
        membershipStatus: true,
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

    return memberships;
  }

  /**
   * Filter memberships by membership type
   */
  async filterByMembershipType(membershipType: MembershipType) {
    const memberships = await prisma.membership.findMany({
      where: { membershipType },
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        membershipType: true,
        paymentType: true,
        membershipStatus: true,
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

    return memberships;
  }

  /**
   * Filter memberships by application date range
   */
  async filterByDateRange(startDate: string, endDate: string) {
    const memberships = await prisma.membership.findMany({
      where: {
        applicationDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        membershipType: true,
        paymentType: true,
        membershipStatus: true,
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

    return memberships;
  }

  /**
   * Search users and return their membership details
   */
  async searchUserMemberships(searchTerm: string) {
    const memberships = await prisma.membership.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { applicationDate: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        membershipType: true,
        paymentType: true,
        membershipStatus: true,
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

    return memberships;
  }
}
