# KACT Backend API - Agents Documentation

## Project Overview

KACT Backend API is a production-ready Node.js/Express/TypeScript authentication system with comprehensive security features, email verification, password reset, and JWT-based authentication.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: JWT (Access + Refresh tokens)
- **Email**: Resend
- **Security**: Helmet, CORS, CSRF protection, Rate limiting
- **Validation**: express-validator

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── prisma.config.ts        # Prisma v7 configuration
├── src/
│   ├── config/
│   │   ├── database.ts         # Prisma client singleton
│   │   ├── jwt.ts              # JWT & bcrypt config
│   │   ├── cors.ts             # CORS configuration
│   │   └── email.ts            # Resend email config
│   │   └── cloudinary.ts      # Cloudinary config
│   ├── controllers/
│   │   ├── auth.controller.ts  # Authentication endpoints
│   │   └── user.controller.ts  # User management
│   │   └── gallery.controller.ts # Gallery endpoints
│   ├── services/
│   │   ├── auth.service.ts     # Auth business logic
│   │   ├── token.service.ts    # JWT operations
│   │   └── email.service.ts    # Email sending
│   │   └── gallery.service.ts # Gallery business logic
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # JWT authentication
│   │   ├── error.middleware.ts # Error handling
│   │   ├── validate.middleware.ts # Request validation
│   │   ├── rateLimiter.middleware.ts # Rate limiting
│   │   └── csrf.middleware.ts  # CSRF protection
│   │   └── upload.middleware.ts # Multer upload config
│   ├── routes/
│   │   ├── auth.routes.ts      # Auth routes
│   │   └── index.ts            # Route aggregation
│   │   └── gallery.routes.ts  # Gallery routes
│   ├── validators/
│   │   └── auth.validator.ts   # Input validators
│   │   └── gallery.validator.ts # Gallery input validators
│   ├── types/
│   │   ├── api.ts              # API type definitions
│   │   └── express.d.ts        # Express extensions
│   ├── utils/
│   │   ├── response.ts         # Response helpers
│   │   ├── token.ts            # Token utilities
│   │   └── errors.ts           # Custom errors
│   ├── templates/
│   │   ├── verificationEmail.ts # Email verification template
│   │   └── passwordResetEmail.ts # Password reset template
│   ├── app.ts                  # Express app config
│   └── server.ts               # Server entry point
├── .env                        # Environment variables
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies & scripts
```

## Database Schema

### User Model
```prisma
model User {
  id                        String    @id @default(cuid())
  email                     String    @unique
  password                  String
  firstName                 String?
  lastName                  String?
  name                      String?
  phone                     String?
### GalleryPhoto Model
```prisma
model GalleryPhoto {
  id         String   @id @default(cuid())
  eventId    String   @map("event_id")
  year       Int
  photoUrl   String   @map("photo_url")
  title      String?
  uploadedAt DateTime @default(now()) @map("uploaded_at")
  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([eventId, year])
  @@index([userId])
  @@map("gallery_photos")
}
  address1                  String
  address2                  String?
  city                      String
  state                     String
  zip                       String
  
  // Email verification
  emailVerified             Boolean   @default(false)
  emailVerificationToken    String?   @unique
  emailVerificationExpiry   DateTime?
  
  // Password reset
  passwordResetToken        String?   @unique
  passwordResetExpiry       DateTime?
  
  // Relationships
  refreshTokens             RefreshToken[]
  
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt
  
  @@index([email])
  @@index([emailVerificationToken])
  @@index([passwordResetToken])
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([token])
}
```

## API Endpoints

### Base URL

### Authentication Routes (`/auth`)

### Gallery Routes (`/gallery`)

#### Upload Photos
```http
POST /api/v1/gallery/upload
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

Form fields:
  eventId: string (required)
  year: number (required)
  title: string (optional)
  photos: array of image files (required)

Response (201):
{
  "success": true,
  "message": "Photos uploaded successfully",
  "data": {
    "photos": [
      {
        "id": "clxxx...",
        "eventId": "event123",
        "year": 2026,
        "photoUrl": "https://res.cloudinary.com/...",
        "title": "My Photo",
        "uploadedAt": "2026-02-12T12:00:00.000Z",
        "userId": "clxxx..."
      }
      // More photos...
    ]
  }
}
```

#### Get Photos by Event & Year
```http
GET /api/v1/gallery/:eventId/:year
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "Photos retrieved successfully",
  "data": {
    "photos": [
      {
        "id": "clxxx...",
        "eventId": "event123",
        "year": 2026,
        "photoUrl": "https://res.cloudinary.com/...",
        "title": "My Photo",
        "uploadedAt": "2026-02-12T12:00:00.000Z",
        "userId": "clxxx..."
      }
      // More photos...
    ]
  }
}
```
#### 1. Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",      // Optional
  "address1": "123 Main St",   // REQUIRED
  "address2": "Apt 4B",        // Optional
  "city": "New York",          // REQUIRED
  "state": "NY",               // REQUIRED
  "zip": "10001"               // REQUIRED
}

Response (201):
{
  "success": true,
  "message": "Registration successful. Please check your email for verification link.",
  "data": {
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "name": "John Doe",
      "emailVerified": false,
      "createdAt": "2026-02-01T12:00:00.000Z"
    }
  }
}
```

#### 2. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "name": "John Doe",
      "emailVerified": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// Refresh token is set in httpOnly cookie
Set-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

#### 3. Verify Email
```http
GET /api/v1/auth/verify-email/:token

Response (200):
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### 4. Resend Verification Email
```http
POST /api/v1/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

#### 5. Forgot Password
```http
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "If that email exists, a password reset link has been sent"
}
```

#### 6. Reset Password
```http
POST /api/v1/auth/reset-password/:token
Content-Type: application/json

{
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}

Response (200):
{
  "success": true,
  "message": "Password reset successful"
}
```

#### 7. Refresh Token
```http
POST /api/v1/auth/refresh
Cookie: refreshToken=xxx

Response (200):
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// New refresh token is set in cookie
Set-Cookie: refreshToken=yyy; HttpOnly; Secure; SameSite=Strict; Max-Age=604800
```

#### 8. Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {accessToken}

Response (200):
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "name": "John Doe",
      "emailVerified": true,
      "createdAt": "2026-02-01T12:00:00.000Z"
    }
  }
}
```

#### 9. Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}
Cookie: refreshToken=xxx

Response (200):
{
  "success": true,
  "message": "Logout successful"
}

// Refresh token cookie is cleared
Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0
```

#### 10. Get All Users (Except Admin)
```http
GET /api/v1/users
Authorization: Bearer {accessToken}
Response (200):
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": "clxxx...",
        "email": ",
        "name": "John Doe",
        "emailVerified": true,
        "createdAt": "2026-02-01T12:00:00.000Z",
      },


      // More users...
    ]
  }
}

### Utility Routes

#### Get CSRF Token
```http
GET /api/v1/csrf-token

Response (200):
{
  "success": true,
  "data": {
    "csrfToken": "xxx..."
  }
}
```

#### Health Check
```http
GET /api/v1/health

Response (200):
{
  "success": true,
  "message": "API is running",
  "timestamp": "2026-02-01T12:00:00.000Z",
  "environment": "development"
}
```

## Authentication Flow

### Registration Flow
1. User submits registration form
2. Backend validates input (email format, password strength, etc.)
3. Backend hashes password with bcrypt (12 rounds)
4. Backend generates 64-char verification token
5. Token is hashed (SHA-256) and stored with 24h expiry
6. User record created in database
7. Verification email sent with token link
8. Response returned to client

### Email Verification Flow
1. User clicks verification link in email
2. Backend receives token from URL parameter
3. Token is hashed and matched against database
4. If valid and not expired, user's `emailVerified` flag is set to true
5. Verification token is cleared from database
6. Welcome email is sent
7. Success response returned

### Login Flow
1. User submits email/password
2. Backend finds user by email
3. Password is verified with bcrypt
4. Access token (15min) and refresh token (7d) are generated
5. Refresh token stored in database
6. Refresh token set in httpOnly cookie
7. Access token returned in response body
8. Client stores access token in memory/state

### Token Refresh Flow
1. When access token expires, client sends refresh token (from cookie)
2. Backend verifies refresh token signature
3. Backend checks if token exists in database and not expired
4. New access token generated
5. New refresh token generated (rotation)
6. Old refresh token deleted, new one stored
7. New tokens returned to client

### Password Reset Flow
1. User requests password reset with email
2. Backend generates 64-char reset token
3. Token hashed and stored with 30min expiry
4. Reset email sent with token link
5. User clicks link and submits new password
6. Backend verifies token and expiry
7. Password hashed and updated
8. All refresh tokens invalidated
9. User must log in again

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Token Security
- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry, stored in httpOnly cookies
- Email verification tokens: 24 hours expiry
- Password reset tokens: 30 minutes expiry
- All tokens use SHA-256 hashing

### Rate Limiting
- Authentication endpoints: 10 requests per 15 minutes per IP
- Email endpoints: 5 requests per hour per IP
- General endpoints: 100 requests per 15 minutes per IP

### CSRF Protection
- Double-submit cookie pattern
- Automatically applied to POST/PUT/PATCH/DELETE routes
- GET requests exempted

### Other Security
- Helmet.js for security headers
- CORS with specific origin whitelist
- Input validation with express-validator
- SQL injection prevention with Prisma
- Password hashing with bcrypt (12 rounds)

## Environment Variables

```bash
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host.neon.tech/db?sslmode=require"

# JWT
JWT_ACCESS_SECRET=your-super-secret-access-token-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=kact-api
JWT_AUDIENCE=kact-users

# Bcrypt
BCRYPT_SALT_ROUNDS=12

# CSRF
CSRF_SECRET=your-csrf-secret-key-min-32-characters

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Email (Resend)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=KACT
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy .env.example to .env
cp .env.example .env

# Update .env with your values
```

### 3. Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. Development
```bash
# Start development server with hot reload
npm run dev
```

### 5. Production Build
```bash
# Build TypeScript to JavaScript
npm run build

# Run migrations in production
npx prisma migrate deploy

# Start production server
npm start
```

## NPM Scripts

```json
{
  "dev": "ts-node-dev with hot reload",
  "build": "Clean dist & compile TypeScript",
  "start": "Run production server",
  "start:prod": "Run with NODE_ENV=production",
  "prisma:generate": "Generate Prisma Client",
  "prisma:migrate": "Run database migrations",
  "prisma:studio": "Open Prisma Studio GUI"
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Custom Error Classes
- `BadRequestError` (400): Invalid input
- `UnauthorizedError` (401): Authentication failed
- `ForbiddenError` (403): Insufficient permissions
- `NotFoundError` (404): Resource not found
- `ConflictError` (409): Duplicate resource
- `InternalServerError` (500): Server error

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Deployment

### Render.com Configuration

**Build Command:**
```bash
npm install && npx prisma generate && npm run build
```

**Start Command:**
```bash
npx prisma migrate deploy && npm start
```

### Environment Variables (Production)
Set all variables from `.env` in your hosting platform's environment configuration.

## API Documentation

Swagger UI available at:
- Development: `http://localhost:5000/api-docs`
- Only accessible in development mode

## Support

For issues or questions:
1. Check error logs
2. Verify environment variables
3. Ensure database connection
4. Check Prisma schema migrations
5. Verify email service configuration

## License

ISC
