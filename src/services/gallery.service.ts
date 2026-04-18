import path from 'path';
type MulterFile = Express.Multer.File;
import prisma from '@config/database';
import cloudinary, { galleryFolder } from '@config/cloudinary';
import { BadRequestError, NotFoundError } from '@utils/errors';


interface UploadGalleryInput {
  eventId: string;
  year: number;
  userId: string;
  files: MulterFile[];
  title?: string;
}

export class GalleryService {
  async uploadPhotos({ eventId, year, userId, files, title }: UploadGalleryInput) {
    if (!files || files.length === 0) {
      throw new BadRequestError('At least one photo is required');
    }

    const uploads = await Promise.all(
      files.map(async (file) => {
        const uploadResult = await this.uploadToCloudinary(file, eventId, year);
        const derivedTitle = title || this.getTitleFromFilename(file.originalname);

        return prisma.galleryPhoto.create({
          data: {
            eventId,
            year,
            userId,
            photoUrl: uploadResult.secure_url,
            title: derivedTitle,
          },
          select: {
            id: true,
            eventId: true,
            year: true,
            photoUrl: true,
            title: true,
            uploadedAt: true,
            userId: true,
          },
        });
      })
    );

    return uploads;
  }

  async getPhotosByEventYear(eventId: string, year: number) {
    return prisma.galleryPhoto.findMany({
      where: {
        eventId,
        year,
      },
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        eventId: true,
        year: true,
        photoUrl: true,
        title: true,
        uploadedAt: true,
        userId: true,
      },
    });
  }

  async deletePhoto(id: string) {
    const photo = await prisma.galleryPhoto.findUnique({ where: { id } });
    if (!photo) {
      throw new NotFoundError('Photo not found');
    }

    // Extract Cloudinary public_id from the URL and attempt cleanup
    try {
      const publicId = this.extractPublicId(photo.photoUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (error) {
      console.error('Failed to delete photo from Cloudinary:', error);
      // Continue with DB deletion even if Cloudinary cleanup fails
    }

    await prisma.galleryPhoto.delete({ where: { id } });
  }

  private extractPublicId(photoUrl: string): string | null {
    try {
      const url = new URL(photoUrl);
      // Cloudinary URLs: .../upload/v{version}/{folder}/{file}.ext
      const uploadIndex = url.pathname.indexOf('/upload/');
      if (uploadIndex === -1) return null;
      const afterUpload = url.pathname.substring(uploadIndex + '/upload/'.length);
      // Remove version prefix (v1234567890/)
      const withoutVersion = afterUpload.replace(/^v\d+\//, '');
      // Remove file extension
      const publicId = withoutVersion.replace(/\.[^.]+$/, '');
      return publicId || null;
    } catch {
      return null;
    }
  }

  private uploadToCloudinary(file: MulterFile, eventId: string, year: number) {
    const folder = `${galleryFolder}/${eventId}/${year}`;

    return new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
        },
        (error: unknown, result: { secure_url?: string } | undefined) => {
          if (error || !result?.secure_url) {
            reject(error || new Error('Cloudinary upload failed'));
            return;
          }

          resolve({ secure_url: result.secure_url });
        }
      );

      stream.end(file.buffer);
    });
  }

  private getTitleFromFilename(filename: string) {
    const basename = path.basename(filename, path.extname(filename));
    return basename || 'Untitled';
  }
}
