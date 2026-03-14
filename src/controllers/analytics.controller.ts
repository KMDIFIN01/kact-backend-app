import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '@services/analytics.service';
import { successResponse, createdResponse } from '@utils/response';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  trackVisit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId, page, referrer, userAgent } = req.body;
      const ip = req.ip || req.socket.remoteAddress || '';

      await this.analyticsService.trackPageVisit({
        sessionId,
        userId: req.user?.id,
        page,
        referrer,
        userAgent,
        ip,
      });

      createdResponse(res, null, 'Visit tracked');
    } catch (error) {
      next(error);
    }
  };

  trackActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionId, action, page, details } = req.body;

      await this.analyticsService.trackActivity({
        sessionId,
        userId: req.user?.id,
        action,
        details,
        page,
      });

      createdResponse(res, null, 'Activity tracked');
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const summary = await this.analyticsService.getSummary(
        startDate || endDate ? { startDate, endDate } : undefined
      );

      successResponse(res, summary, 'Analytics summary retrieved');
    } catch (error) {
      next(error);
    }
  };

  getUserReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const users = await this.analyticsService.getUserReport(
        startDate || endDate ? { startDate, endDate } : undefined
      );

      successResponse(res, { users }, 'User activity report retrieved');
    } catch (error) {
      next(error);
    }
  };

  getVisitorReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const visitors = await this.analyticsService.getVisitorReport(
        startDate || endDate ? { startDate, endDate } : undefined
      );

      successResponse(res, visitors, 'Visitor report retrieved');
    } catch (error) {
      next(error);
    }
  };
}
