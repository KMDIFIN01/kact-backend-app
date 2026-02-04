import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { corsConfig } from '@config/cors';
import { generalLimiter } from '@middlewares/rateLimiter.middleware';
import { csrfTokenHandler, doubleCsrfProtection } from '@middlewares/csrf.middleware';
import { errorHandler, notFoundHandler } from '@middlewares/error.middleware';
import routes from './routes/index';

const app: Application = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KACT API',
      version: '1.0.0',
      description: 'Backend API for KACT application',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [
    './src/routes/*.ts',
    './dist/routes/*.js',
    __dirname + '/routes/*.ts',
    __dirname + '/routes/*.js'
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet());
app.use(cors(corsConfig)); // This should come EARLY

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api', generalLimiter);

// CSRF protection
app.use(csrfTokenHandler);
app.use(doubleCsrfProtection);

// API Documentation
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Routes
app.use('/api/v1', routes); // Routes come AFTER

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
