import type { File as MulterFile } from 'multer';
import { User } from './api';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      files?: MulterFile[];
    }
  }
}

export {};
