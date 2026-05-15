import prisma from '@config/database';
import cloudinary from '@config/cloudinary';
import { NotFoundError, BadRequestError } from '@utils/errors';

interface CreateObituaryInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  photoUrl?: string;
  birthDate: Date;
  deathDate: Date;
  age?: number;
}

interface UpdateObituaryInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  photoUrl?: string;
  birthDate?: Date;
  deathDate?: Date;
  age?: number;
}

const selectFields = {
  id: true,
  firstName: true,
  middleName: true,
  lastName: true,
  photoUrl: true,
  birthDate: true,
  deathDate: true,
  age: true,
  createdAt: true,
  updatedAt: true,
};

const OBITUARY_FOLDER = process.env.OBITUARY_CLOUDINARY_FOLDER || 'kact/obituaries';

export class ObituaryService {
  async create(data: CreateObituaryInput) {
    return prisma.obituary.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName || null,
        lastName: data.lastName,
        photoUrl: data.photoUrl || null,
        birthDate: data.birthDate,
        deathDate: data.deathDate,
        age: data.age || null,
      },
      select: selectFields,
    });
  }

  async findAll() {
    return prisma.obituary.findMany({
      orderBy: { deathDate: 'desc' },
      select: selectFields,
    });
  }

  async findById(id: string) {
    const obituary = await prisma.obituary.findUnique({
      where: { id },
      select: selectFields,
    });

    if (!obituary) {
      throw new NotFoundError('Obituary not found');
    }

    return obituary;
  }

  async update(id: string, data: UpdateObituaryInput) {
    const existing = await prisma.obituary.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Obituary not found');
    }

    return prisma.obituary.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.middleName !== undefined && { middleName: data.middleName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
        ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
        ...(data.deathDate !== undefined && { deathDate: data.deathDate }),
        ...(data.age !== undefined && { age: data.age }),
      },
      select: selectFields,
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await prisma.obituary.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Obituary not found');
    }

    // Delete associated image from Cloudinary if it exists
    if (existing.photoUrl) {
      await this.deleteImage(existing.photoUrl);
    }

    await prisma.obituary.delete({ where: { id } });
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
    const folder = OBITUARY_FOLDER;

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
