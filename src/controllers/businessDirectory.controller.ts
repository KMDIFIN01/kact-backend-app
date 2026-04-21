import { Request, Response, NextFunction } from 'express';
import { BusinessDirectoryService } from '@services/businessDirectory.service';
import { successResponse, createdResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';
import { BusinessDirectoryStatus } from '../types/api';

export class BusinessDirectoryController {
  private service: BusinessDirectoryService;

  constructor() {
    this.service = new BusinessDirectoryService();
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { businessName, serviceCategory, websiteUrl, contactName, phone, email, address, notes } = req.body;
      const listing = await this.service.create({ businessName, serviceCategory, websiteUrl, contactName, phone, email, address, notes });
      createdResponse(res, { listing }, 'Business listing submitted successfully');
    } catch (error) {
      next(error);
    }
  };

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listings = await this.service.getAll();
      successResponse(res, { listings }, 'Business listings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getApproved = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const listings = await this.service.getApproved();
      successResponse(res, { listings }, 'Business listings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { status, notes } = req.body;
      const approvedBy = req.user?.id;

      if (!approvedBy) {
        throw new BadRequestError('Authenticated admin user required');
      }

      const listing = await this.service.updateStatus({ id, status: status as BusinessDirectoryStatus, approvedBy, notes });
      successResponse(res, { listing }, 'Business listing status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids, status } = req.body;
      const approvedBy = req.user?.id;

      if (!approvedBy) {
        throw new BadRequestError('Authenticated admin user required');
      }

      const listings = await this.service.bulkUpdateStatus(ids as string[], status as BusinessDirectoryStatus, approvedBy);
      successResponse(res, { listings }, 'Business listings status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getPendingCount = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await this.service.getPendingCount();
      successResponse(res, { count }, 'Pending count retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
