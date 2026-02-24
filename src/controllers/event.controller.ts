import { Request, Response, NextFunction } from 'express';
import { EventService } from '@services/event.service';
import { successResponse, createdResponse } from '@utils/response';

export class EventController {
  private eventService: EventService;

  constructor() {
    this.eventService = new EventService();
  }

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const events = await this.eventService.getAll();
      successResponse(res, { events }, 'Events retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { programmeName, programmeType, date, time, location, comments } = req.body;
      const event = await this.eventService.createEvent({
        programmeName,
        programmeType,
        date,
        time,
        location,
        comments,
      });
      createdResponse(res, { event }, 'Event created successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { programmeName, programmeType, date, time, location, comments } = req.body;
      const event = await this.eventService.updateEvent(id, {
        programmeName,
        programmeType,
        date,
        time,
        location,
        comments,
      });
      successResponse(res, { event }, 'Event updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.eventService.deleteEvent(id);
      successResponse(res, null, 'Event deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
