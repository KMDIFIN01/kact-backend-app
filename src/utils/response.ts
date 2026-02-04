import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types/api';

export const successResponse = <T>(
  res: Response,
  data: T | null,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    ...(data && { data }),
  };

  res.status(statusCode).json(response);
};

export const createdResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): void => {
  successResponse(res, data, message, 201);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500
): void => {
  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

export const validationErrorResponse = (
  res: Response,
  errors: Array<{ field: string; message: string }>
): void => {
  res.status(400).json({
    success: false,
    error: 'Validation failed',
    errors,
  });
};

export const paginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  statusCode: number = 200
): void => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  res.status(statusCode).json(response);
};
