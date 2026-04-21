import prisma from '@config/database';
import { NotFoundError } from '@utils/errors';
import { BusinessDirectoryStatus } from '../types/api';

interface CreateBusinessDirectoryInput {
  businessName: string;
  serviceCategory: string;
  websiteUrl?: string;
  contactName?: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
}

interface UpdateStatusInput {
  id: string;
  status: BusinessDirectoryStatus;
  approvedBy: string;
  notes?: string;
}

const selectFields = {
  id: true,
  businessName: true,
  serviceCategory: true,
  websiteUrl: true,
  contactName: true,
  phone: true,
  email: true,
  address: true,
  status: true,
  approvedDate: true,
  approvedBy: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
};

export class BusinessDirectoryService {
  async create(data: CreateBusinessDirectoryInput) {
    return prisma.businessDirectory.create({
      data: {
        businessName: data.businessName,
        serviceCategory: data.serviceCategory,
        websiteUrl: data.websiteUrl || null,
        contactName: data.contactName || null,
        phone: data.phone,
        email: data.email,
        address: data.address,
        notes: data.notes || null,
      },
      select: selectFields,
    });
  }

  async getAll() {
    return prisma.businessDirectory.findMany({
      orderBy: { createdAt: 'desc' },
      select: selectFields,
    });
  }

  async getApproved() {
    return prisma.businessDirectory.findMany({
      where: { status: 'APPROVED' },
      orderBy: { businessName: 'asc' },
      select: selectFields,
    });
  }

  async updateStatus({ id, status, approvedBy, notes }: UpdateStatusInput) {
    const existing = await prisma.businessDirectory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Business listing not found');
    }

    return prisma.businessDirectory.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedDate: status === BusinessDirectoryStatus.APPROVED ? new Date() : null,
        ...(notes !== undefined ? { notes } : {}),
      },
      select: selectFields,
    });
  }

  async bulkUpdateStatus(ids: string[], status: BusinessDirectoryStatus, approvedBy: string) {
    await prisma.businessDirectory.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        approvedBy,
        approvedDate: status === BusinessDirectoryStatus.APPROVED ? new Date() : null,
      },
    });

    return prisma.businessDirectory.findMany({
      where: { id: { in: ids } },
      select: selectFields,
    });
  }

  async getPendingCount(): Promise<number> {
    return prisma.businessDirectory.count({ where: { status: 'PENDING' } });
  }
}
