import prisma from '@config/database';
import cloudinary from '@config/cloudinary';
import { NotFoundError, BadRequestError } from '@utils/errors';
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
  imageUrl?: string;
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
  imageUrl: true,
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

const BUSINESS_DIRECTORY_FOLDER = process.env.BUSINESS_DIRECTORY_CLOUDINARY_FOLDER || 'kact/business-directory';

export class BusinessDirectoryService {
  async create(data: CreateBusinessDirectoryInput) {
    return prisma.businessDirectory.create({
      data: {
        businessName: data.businessName,
        serviceCategory: data.serviceCategory,
        websiteUrl: data.websiteUrl || null,
        imageUrl: data.imageUrl || null,
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

  async delete(id: string): Promise<void> {
    const existing = await prisma.businessDirectory.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Business listing not found');
    }

    await prisma.businessDirectory.delete({ where: { id } });
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
    const folder = BUSINESS_DIRECTORY_FOLDER;

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
}
