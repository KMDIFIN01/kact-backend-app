import { Request, Response, NextFunction } from 'express';
type MulterFile = Express.Multer.File;
import { GalleryService } from '@services/gallery.service';
import { successResponse, createdResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';

export class GalleryController {
  private galleryService: GalleryService;

  constructor() {
    this.galleryService = new GalleryService();
  }

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { eventId, year, title } = req.body;
      const userId = req.user?.id;
      const files = req.files as MulterFile[] | undefined;

      if (!userId) {
        throw new BadRequestError('Authenticated user required');
      }

      const parsedYear = Number.parseInt(year, 10);
      const photos = await this.galleryService.uploadPhotos({
        eventId,
        year: parsedYear,
        userId,
        files: files || [],
        title,
      });

      createdResponse(res, { photos }, 'Photos uploaded successfully');
    } catch (error) {
      next(error);
    }
  };

  getByEventYear = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eventIdParam = req.params.eventId;
      const yearParam = req.params.year;
      const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;
      const yearValue = Array.isArray(yearParam) ? yearParam[0] : yearParam;
      const parsedYear = Number.parseInt(yearValue, 10);
      const photos = await this.galleryService.getPhotosByEventYear(eventId, parsedYear);
      successResponse(res, { photos }, 'Photos retrieved successfully');   
        } catch (error) {
      next(error);
    }
  };
}
