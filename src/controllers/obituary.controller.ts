import { Request, Response, NextFunction } from 'express';
import { ObituaryService } from '@services/obituary.service';
import { successResponse, createdResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';

type MulterFile = Express.Multer.File;

export class ObituaryController {
  private service: ObituaryService;

  constructor() {
    this.service = new ObituaryService();
  }

  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const files = req.files as MulterFile[] | undefined;
      const file = files?.[0] ?? (req.file as MulterFile | undefined);

      if (!file) {
        throw new BadRequestError('An image file is required');
      }

      const imageUrl = await this.service.uploadImage(file);
      createdResponse(res, { imageUrl }, 'Image uploaded successfully');
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        firstName, 
        middleName, 
        lastName, 
        photoUrl, 
        birthDate, 
        deathDate, 
        age,
        funeralDate,
        funeralTime,
        funeralServiceLocation,
        funeralServiceAddress,
        burialServiceLocation,
        burialServiceAddress
      } = req.body;
      
      const obituary = await this.service.create({
        firstName,
        middleName,
        lastName,
        photoUrl,
        birthDate: new Date(birthDate),
        deathDate: new Date(deathDate),
        age: age ? parseInt(age, 10) : undefined,
        funeralDate: funeralDate ? new Date(funeralDate) : undefined,
        funeralTime,
        funeralServiceLocation,
        funeralServiceAddress,
        burialServiceLocation,
        burialServiceAddress,
      });
      
      createdResponse(res, { obituary }, 'Obituary created successfully');
    } catch (error) {
      next(error);
    }
  };

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const obituaries = await this.service.findAll();
      successResponse(res, { obituaries }, 'Obituaries retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const obituary = await this.service.findById(id);
      successResponse(res, { obituary }, 'Obituary retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { 
        firstName, 
        middleName, 
        lastName, 
        photoUrl, 
        birthDate, 
        deathDate, 
        age,
        funeralDate,
        funeralTime,
        funeralServiceLocation,
        funeralServiceAddress,
        burialServiceLocation,
        burialServiceAddress
      } = req.body;
      
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (middleName !== undefined) updateData.middleName = middleName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
      if (birthDate !== undefined) updateData.birthDate = new Date(birthDate);
      if (deathDate !== undefined) updateData.deathDate = new Date(deathDate);
      if (age !== undefined) updateData.age = parseInt(age, 10);
      if (funeralDate !== undefined) updateData.funeralDate = funeralDate ? new Date(funeralDate) : null;
      if (funeralTime !== undefined) updateData.funeralTime = funeralTime;
      if (funeralServiceLocation !== undefined) updateData.funeralServiceLocation = funeralServiceLocation;
      if (funeralServiceAddress !== undefined) updateData.funeralServiceAddress = funeralServiceAddress;
      if (burialServiceLocation !== undefined) updateData.burialServiceLocation = burialServiceLocation;
      if (burialServiceAddress !== undefined) updateData.burialServiceAddress = burialServiceAddress;

      const obituary = await this.service.update(id, updateData);
      successResponse(res, { obituary }, 'Obituary updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await this.service.delete(id);
      successResponse(res, null, 'Obituary deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
