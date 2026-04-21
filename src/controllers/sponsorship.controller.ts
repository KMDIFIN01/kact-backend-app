import { Request, Response, NextFunction } from 'express';
import { SponsorshipService } from '@services/sponsorship.service';
import { successResponse, createdResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';
type MulterFile = Express.Multer.File;

export class SponsorshipController {
  private sponsorshipService: SponsorshipService;

  constructor() {
    this.sponsorshipService = new SponsorshipService();
  }

  /**
   * Create a new sponsorship application
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        businessName,
        businessType,
        websiteUrl,
        imageUrl,
        firstName,
        lastName,
        email,
        phoneNumber,
        address1,
        address2,
        city,
        state,
        zip,
        sponsorshipType,
        paymentType,
        notes,
      } = req.body;

      const sponsorship = await this.sponsorshipService.createSponsorship({
        businessName,
        businessType,
        websiteUrl,
        imageUrl,
        firstName,
        lastName,
        email,
        phoneNumber,
        address1,
        address2,
        city,
        state,
        zip,
        sponsorshipType,
        paymentType,
        notes,
      });

      createdResponse(res, { sponsorship }, 'Sponsorship application created successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all sponsorship applications
   */
  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sponsorships = await this.sponsorshipService.getAllSponsorships();
      successResponse(res, { sponsorships }, 'Sponsorships retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update sponsorship status (approve/reject/expire)
   */
  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      const { sponsorshipStatus } = req.body;
      const approvedBy = req.user?.id;

      if (!approvedBy) {
        throw new BadRequestError('Authenticated admin user required');
      }

      const sponsorship = await this.sponsorshipService.updateSponsorshipStatus({
        id,
        sponsorshipStatus,
        approvedBy,
      });

      successResponse(res, { sponsorship }, 'Sponsorship status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk update sponsorship status for multiple sponsorships
   */
  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids, sponsorshipStatus } = req.body;
      const approvedBy = req.user?.id;

      if (!approvedBy) {
        throw new BadRequestError('Authenticated admin user required');
      }

      const result = await this.sponsorshipService.bulkUpdateSponsorshipStatus(
        ids,
        sponsorshipStatus,
        approvedBy
      );

      successResponse(
        res,
        result,
        `${result.count} sponsorship(s) status updated successfully`
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Filter sponsorships by status
   */
  filterByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const statusParam = req.params.status;
      const status = Array.isArray(statusParam) ? statusParam[0] : statusParam;

      const sponsorships = await this.sponsorshipService.filterByStatus(status as any);
      successResponse(res, { sponsorships }, `Sponsorships with status ${status} retrieved successfully`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Filter sponsorships by payment type
   */
  filterByPaymentType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paymentTypeParam = req.params.paymentType;
      const paymentType = Array.isArray(paymentTypeParam) ? paymentTypeParam[0] : paymentTypeParam;

      const sponsorships = await this.sponsorshipService.filterByPaymentType(paymentType as any);
      successResponse(res, { sponsorships }, `Sponsorships with payment type ${paymentType} retrieved successfully`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search sponsorships by business name, first name, last name, email, or sponsorship type
   */
  searchSponsorships = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { searchTerm } = req.body;

      const sponsorships = await this.sponsorshipService.searchSponsorships(searchTerm);
      successResponse(res, { sponsorships }, `Search results for "${searchTerm}"`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Filter sponsorships by application date range
   */
  /**
   * Upload an image for sponsorship
   */
  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as MulterFile[] | undefined;
      const file = files?.[0] ?? (req.file as MulterFile | undefined);

      if (!file) {
        throw new BadRequestError('An image file is required');
      }

      const imageUrl = await this.sponsorshipService.uploadImage(file);
      createdResponse(res, { imageUrl }, 'Image uploaded successfully');
    } catch (error) {
      next(error);
    }
  };
  filterByDateRange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.body;

      const sponsorships = await this.sponsorshipService.filterByDateRange(startDate, endDate);
      successResponse(
        res,
        { sponsorships, count: sponsorships.length },
        `Found ${sponsorships.length} sponsorship(s) between ${startDate} and ${endDate}`
      );
    } catch (error) {
      next(error);
    }
  };
}
