import { Request, Response, NextFunction } from 'express';
import { MembershipService } from '@services/membership.service';
import { successResponse, createdResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';

export class MembershipController {
  private membershipService: MembershipService;

  constructor() {
    this.membershipService = new MembershipService();
  }

  /**
   * Create a new membership application
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        address1,
        address2,
        city,
        state,
        zip,
        membershipType,
        paymentType,
        notes,
      } = req.body;

      const membership = await this.membershipService.createMembership({
        firstName,
        lastName,
        email,
        phoneNumber,
        address1,
        address2,
        city,
        state,
        zip,
        membershipType,
        paymentType,
        notes,
      });

      createdResponse(res, { membership }, 'Membership application created successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all membership applications
   */
  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const memberships = await this.membershipService.getAllMemberships();
      successResponse(res, { memberships }, 'Memberships retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update membership status (approve/reject/expire)
   */
  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idParam = req.params.id;
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      const { membershipStatus } = req.body;
      const approvedBy = req.user?.id;

      if (!approvedBy) {
        throw new BadRequestError('Authenticated admin user required');
      }

      const membership = await this.membershipService.updateMembershipStatus({
        id,
        membershipStatus,
        approvedBy,
      });

      successResponse(res, { membership }, 'Membership status updated successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk update membership status for multiple memberships
   */
  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids, membershipStatus } = req.body;
      const approvedBy = req.user?.id;

      if (!approvedBy) {
        throw new BadRequestError('Authenticated admin user required');
      }

      const result = await this.membershipService.bulkUpdateMembershipStatus(
        ids,
        membershipStatus,
        approvedBy
      );

      successResponse(
        res,
        result,
        `${result.count} membership(s) status updated successfully`
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Filter memberships by status
   */
  filterByStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const statusParam = req.params.status;
      const status = Array.isArray(statusParam) ? statusParam[0] : statusParam;
      
      const memberships = await this.membershipService.filterByStatus(status as any);
      successResponse(res, { memberships }, `Memberships with status ${status} retrieved successfully`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Filter memberships by payment type
   */
  filterByPaymentType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paymentTypeParam = req.params.paymentType;
      const paymentType = Array.isArray(paymentTypeParam) ? paymentTypeParam[0] : paymentTypeParam;
      
      const memberships = await this.membershipService.filterByPaymentType(paymentType as any);
      successResponse(res, { memberships }, `Memberships with payment type ${paymentType} retrieved successfully`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search memberships by first name or last name
   */
  searchMemberships = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { searchTerm } = req.body;
      
      const memberships = await this.membershipService.searchMemberships(searchTerm);
      successResponse(res, { memberships }, `Search results for "${searchTerm}"`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Filter memberships by membership type
   */
  filterByMembershipType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const membershipTypeParam = req.params.membershipType;
      const membershipType = Array.isArray(membershipTypeParam) ? membershipTypeParam[0] : membershipTypeParam;
      
      const memberships = await this.membershipService.filterByMembershipType(membershipType as any);
      successResponse(res, { memberships }, `Memberships with type ${membershipType} retrieved successfully`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Filter memberships by application date range
   */
  filterByDateRange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate } = req.body;
      
      const memberships = await this.membershipService.filterByDateRange(startDate, endDate);
      successResponse(
        res,
        { memberships, count: memberships.length },
        `Found ${memberships.length} membership(s) between ${startDate} and ${endDate}`
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search users and return their membership details
   */
  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { searchTerm } = req.body;
      
      const memberships = await this.membershipService.searchUserMemberships(searchTerm);
      
      successResponse(res, { memberships }, `Found ${memberships.length} membership(s) for "${searchTerm}"`);
    } catch (error) {
      next(error);
    }
  };
}
