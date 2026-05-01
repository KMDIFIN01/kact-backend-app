import prisma from '@config/database';
import { NotFoundError, BadRequestError } from '@utils/errors';
import { MembershipType, PaymentType, MembershipStatus, FamilyMemberType } from '../types/api';
import { EmailService } from './email.service';

interface FamilyMemberInput {
  type: FamilyMemberType;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  age?: number;
}

interface CreateMembershipInput {
  firstName: string;
  middleName?: string;
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
  familyMembers?: FamilyMemberInput[];
}

interface UpdateMembershipStatusInput {
  id: string;
  membershipStatus: MembershipStatus;
  approvedBy: string;
}

interface CurrentUserMembershipStatus {
  isApprovedMember: boolean;
  membership: {
    id: string;
    membershipType: string;
    membershipStatus: string;
    applicationDate: Date;
    approvedDate: Date | null;
  } | null;
}

export class MembershipService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Create a new membership application
   */
  async createMembership(data: CreateMembershipInput) {
    const membership = await prisma.membership.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName || null,
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
        ...(data.familyMembers && data.familyMembers.length > 0 ? {
          familyMembers: {
            create: data.familyMembers.map(fm => ({
              type: fm.type,
              firstName: fm.firstName,
              lastName: fm.lastName,
              email: fm.email || null,
              phoneNumber: fm.phoneNumber || null,
              age: fm.age ?? null,
            })),
          },
        } : {}),
      },
      select: {
        id: true,
        firstName: true,
        middleName: true,
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
        familyMembers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send application submitted email
    await this.emailService.sendApplicationSubmittedEmail(
      data.email,
      `${data.firstName} ${data.lastName}`,
      'membership'
    );

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
        familyMembers: true,
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
        familyMembers: true,
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
    if (membershipStatus === 'APPROVED' || membershipStatus === 'REJECTED') {
      await this.emailService.sendApplicationStatusEmail(
        updatedMembership.email,
        `${updatedMembership.firstName} ${updatedMembership.lastName}`,
        'membership',
        membershipStatus as 'APPROVED' | 'REJECTED'
      );
    }

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
        familyMembers: true,
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
    if (membershipStatus === 'APPROVED' || membershipStatus === 'REJECTED') {
      for (const membership of updatedMemberships) {
        await this.emailService.sendApplicationStatusEmail(
          membership.email,
          `${membership.firstName} ${membership.lastName}`,
          'membership',
          membershipStatus as 'APPROVED' | 'REJECTED'
        );
      }
    }

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
        familyMembers: true,
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
        familyMembers: true,
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
        familyMembers: true,
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
        familyMembers: true,
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
        familyMembers: true,
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
        familyMembers: true,
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
   * Bulk import memberships from parsed spreadsheet rows
   */
  async bulkImportMemberships(rows: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    address1?: string;
    city?: string;
    state?: string;
    zip?: string;
    membershipType: string;
    spouseFirstName?: string;
    spouseLastName?: string;
    spouseEmail?: string;
  }[]): Promise<{ imported: number; skipped: number; errors: { row: number; reason: string }[] }> {
    const VALID_MEMBERSHIP_TYPES = ['LIFETIME', 'FAMILY', 'INDIVIDUAL', 'STUDENT', 'DECADE'];
    // phone, city, state, zip are not present in the CSV — they will default to N/A / 00000
    const REQUIRED_FIELDS = ['firstName', 'lastName', 'email', 'membershipType'];

    const errors: { row: number; reason: string }[] = [];
    const validRows: (typeof rows[number] & { membershipType: string; rowNum: number })[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // +2: 1-based index + header row
      const missing = REQUIRED_FIELDS.filter(f => !row[f as keyof typeof row] || String(row[f as keyof typeof row]).trim() === '');
      if (missing.length > 0) {
        errors.push({ row: rowNum, reason: `Missing required fields: ${missing.join(', ')}` });
        return;
      }
      const membershipType = String(row.membershipType).toUpperCase().trim();
      if (!VALID_MEMBERSHIP_TYPES.includes(membershipType)) {
        errors.push({ row: rowNum, reason: `Invalid membershipType "${row.membershipType}". Must be one of: ${VALID_MEMBERSHIP_TYPES.join(', ')}` });
        return;
      }
      validRows.push({ ...row, membershipType, rowNum });
    });

    let imported = 0;
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        const hasSpouse =
          row.spouseFirstName && String(row.spouseFirstName).trim() &&
          row.spouseLastName && String(row.spouseLastName).trim();

        await tx.membership.create({
          data: {
            firstName: String(row.firstName).trim(),
            middleName: row.middleName ? String(row.middleName).trim() : null,
            lastName: String(row.lastName).trim(),
            email: String(row.email).trim(),
            phoneNumber: row.phoneNumber ? String(row.phoneNumber).trim() : 'N/A',
            address1: row.address1 ? String(row.address1).trim() : 'N/A',
            address2: null,
            city: row.city ? String(row.city).trim() : 'N/A',
            state: row.state ? String(row.state).trim() : 'N/A',
            zip: row.zip ? String(row.zip).trim() : '00000',
            membershipType: row.membershipType as any,
            paymentType: 'CASH',
            membershipStatus: 'APPROVED',
            approvedDate: now,
            ...(hasSpouse
              ? {
                  familyMembers: {
                    create: {
                      type: 'SPOUSE' as FamilyMemberType,
                      firstName: String(row.spouseFirstName).trim(),
                      lastName: String(row.spouseLastName).trim(),
                      email: row.spouseEmail ? String(row.spouseEmail).trim() : null,
                    },
                  },
                }
              : {}),
          },
        });
        imported++;
      }
    });

    return { imported, skipped: errors.length, errors };
  }

  /**
   * Get current user's membership status by email
   */
  async getCurrentUserMembershipStatus(email: string): Promise<CurrentUserMembershipStatus> {
    const normalizedEmail = email.trim();

    const approvedMembership = await prisma.membership.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
        membershipStatus: 'APPROVED',
      },
      orderBy: [{ approvedDate: 'desc' }, { applicationDate: 'desc' }],
      select: {
        id: true,
        membershipType: true,
        membershipStatus: true,
        applicationDate: true,
        approvedDate: true,
      },
    });

    const membership = approvedMembership ?? await prisma.membership.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      orderBy: [{ applicationDate: 'desc' }],
      select: {
        id: true,
        membershipType: true,
        membershipStatus: true,
        applicationDate: true,
        approvedDate: true,
      },
    });

    return {
      isApprovedMember: membership?.membershipStatus === 'APPROVED',
      membership: membership ?? null,
    };
  }
}
