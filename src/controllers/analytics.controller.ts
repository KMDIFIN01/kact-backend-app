import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '@services/analytics.service';
import { successResponse, createdResponse } from '@utils/response';

function parseDateRange(query: Request['query']) {
  const startDate = query.startDate ? new Date(query.startDate as string) : undefined;
  let endDate = query.endDate ? new Date(query.endDate as string) : undefined;
  // When only a date string like "2026-03-14" is passed, Date parses it as midnight UTC.
  // Set endDate to 23:59:59.999 so the filter includes the entire day.
  if (endDate) {
    endDate.setUTCHours(23, 59, 59, 999);
  }
  return startDate || endDate ? { startDate, endDate } : undefined;
}

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
      const dateRange = parseDateRange(req.query);

      const summary = await this.analyticsService.getSummary(dateRange);

      successResponse(res, summary, 'Analytics summary retrieved');
    } catch (error) {
      next(error);
    }
  };

  getUserReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dateRange = parseDateRange(req.query);

      const users = await this.analyticsService.getUserReport(dateRange);

      successResponse(res, { users }, 'User activity report retrieved');
    } catch (error) {
      next(error);
    }
  };

  getVisitorReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dateRange = parseDateRange(req.query);

      const visitors = await this.analyticsService.getVisitorReport(dateRange);

      successResponse(res, visitors, 'Visitor report retrieved');
    } catch (error) {
      next(error);
    }
  };
}
