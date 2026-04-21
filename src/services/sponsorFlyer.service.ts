import prisma from '@config/database';
import cloudinary from '@config/cloudinary';
import { BadRequestError, NotFoundError } from '@utils/errors';
import { SponsorFlyerTier } from '../types/api';

const FLYER_FOLDER = process.env.SPONSOR_FLYER_CLOUDINARY_FOLDER || 'kact/sponsor-flyers';

export class SponsorFlyerService {
  async upload(tier: SponsorFlyerTier, file: Express.Multer.File, title: string | undefined, userId: string) {
    if (!file) {
      throw new BadRequestError('A flyer image is required');
    }

    const flyerUrl = await this.uploadToCloudinary(file, tier);

    return prisma.sponsorFlyer.create({
      data: {
        tier,
        flyerUrl,
        title: title || null,
        uploadedBy: userId,
      },
      select: {
        id: true,
        tier: true,
        flyerUrl: true,
        title: true,
        uploadedBy: true,
        createdAt: true,
      },
    });
  }

  async getAll() {
    return prisma.sponsorFlyer.findMany({
      orderBy: [{ tier: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        tier: true,
        flyerUrl: true,
        title: true,
        uploadedBy: true,
        createdAt: true,
      },
    });
  }

  async getByTier(tier: SponsorFlyerTier) {
    return prisma.sponsorFlyer.findMany({
      where: { tier },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tier: true,
        flyerUrl: true,
        title: true,
        uploadedBy: true,
        createdAt: true,
      },
    });
  }

  async delete(id: string) {
    const flyer = await prisma.sponsorFlyer.findUnique({ where: { id } });
    if (!flyer) {
      throw new NotFoundError('Sponsor flyer not found');
    }

    try {
      const publicId = this.extractPublicId(flyer.flyerUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error('Failed to delete flyer from Cloudinary:', error);
    }

    await prisma.sponsorFlyer.delete({ where: { id } });
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

  private uploadToCloudinary(file: Express.Multer.File, tier: string): Promise<string> {
    const folder = `${FLYER_FOLDER}/${tier.toLowerCase()}`;

    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image', use_filename: true, unique_filename: true },
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
}
