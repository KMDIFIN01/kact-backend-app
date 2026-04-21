import { Request, Response, NextFunction } from 'express';
import { SponsorFlyerService } from '@services/sponsorFlyer.service';
import { successResponse, createdResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';
import { SponsorFlyerTier } from '../types/api';

type MulterFile = Express.Multer.File;

export class SponsorFlyerController {
  private service: SponsorFlyerService;

  constructor() {
    this.service = new SponsorFlyerService();
  }

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tier, title } = req.body;
      const userId = req.user?.id;
      const files = req.files as MulterFile[] | undefined;
      const file = files?.[0] ?? (req.file as MulterFile | undefined);

      if (!userId) {
        throw new BadRequestError('Authenticated admin user required');
      }

      if (!file) {
        throw new BadRequestError('A flyer image file is required');
      }

      if (!Object.values(SponsorFlyerTier).includes(tier as SponsorFlyerTier)) {
        throw new BadRequestError('Invalid tier value');
      }

      const flyer = await this.service.upload(tier as SponsorFlyerTier, file, title, userId);
      createdResponse(res, { flyer }, 'Sponsor flyer uploaded successfully');
    } catch (error) {
      next(error);
    }
  };

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const flyers = await this.service.getAll();
      successResponse(res, { flyers }, 'Sponsor flyers retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.service.delete(id);
      successResponse(res, null, 'Sponsor flyer deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
