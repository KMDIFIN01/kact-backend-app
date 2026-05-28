import { Request, Response, NextFunction } from 'express';
import multer, { type FileFilterCallback } from 'multer';
type MulterFile = Express.Multer.File;
import { BadRequestError } from '@utils/errors';

const maxFileSizeMb = Number.parseInt(process.env.GALLERY_MAX_FILE_SIZE_MB || '10', 10);
const maxFiles = Number.parseInt(process.env.GALLERY_MAX_FILES || '10', 10);
const allowedMimeTypes = (process.env.GALLERY_ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/webp,image/gif')
  .split(',')
  .map((type) => type.trim())
  .filter(Boolean);

const storage = multer.memoryStorage();

const fileFilter: multer.Options['fileFilter'] = (
  _req: Request,
  file: MulterFile,
  cb: FileFilterCallback
) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new BadRequestError('Only image uploads are allowed'));
    return;
  }

  cb(null, true);
};

const uploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024,
    files: maxFiles,
  },
});

export const galleryUpload = (req: Request, res: Response, next: NextFunction): void => {
  uploader.array('photos', maxFiles)(req, res, (err: unknown) => {
    if (err instanceof Error) {
      next(new BadRequestError(err.message));
      return;
    }

    next();
  });
};

export const galleryUploadConfig = {
  maxFileSizeMb,
  maxFiles,
  allowedMimeTypes,
};

// ── Announcement attachments (images + PDF, max 5 files, 10 MB each) ──

const ANNOUNCEMENT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const announcementUploader = multer({
  storage,
  fileFilter: (_req: Request, file: MulterFile, cb: FileFilterCallback) => {
    if (!ANNOUNCEMENT_ALLOWED_TYPES.includes(file.mimetype)) {
      cb(new BadRequestError('Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

export const announcementUpload = (req: Request, res: Response, next: NextFunction): void => {
  announcementUploader.array('attachments', 5)(req, res, (err: unknown) => {
    if (err instanceof Error) {
      next(new BadRequestError(err.message));
      return;
    }
    next();
  });
};

// ── Broadcast images (images only, max 5 files, 10 MB each) ──

const BROADCAST_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const broadcastImageUploader = multer({
  storage,
  fileFilter: (_req: Request, file: MulterFile, cb: FileFilterCallback) => {
    if (!BROADCAST_ALLOWED_TYPES.includes(file.mimetype)) {
      cb(new BadRequestError('Only images (JPEG, PNG, GIF, WebP) are allowed'));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

export const broadcastImageUpload = (req: Request, res: Response, next: NextFunction): void => {
  broadcastImageUploader.array('images', 5)(req, res, (err: unknown) => {
    if (err instanceof Error) {
      next(new BadRequestError(err.message));
      return;
    }
    next();
  });
};
