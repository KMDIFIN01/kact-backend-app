export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER';
  emailVerified: boolean;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export enum MembershipType {
  LIFETIME = 'LIFETIME',
  FAMILY = 'FAMILY',
  INDIVIDUAL = 'INDIVIDUAL',
  STUDENT = 'STUDENT',
  DECADE = 'DECADE',
}

export enum PaymentType {
  ZIFFY = 'ZIFFY',
  CASH = 'CASH',
}

export enum MembershipStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum FamilyMemberType {
  SPOUSE = 'SPOUSE',
  CHILD = 'CHILD',
}

export interface FamilyMember {
  id: string;
  membershipId: string;
  type: FamilyMemberType;
  firstName: string;
  lastName: string;
  email: string | null;
  phoneNumber: string | null;
  age: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  membershipType: MembershipType;
  paymentType: PaymentType;
  membershipStatus: MembershipStatus;
  applicationDate: Date;
  approvedDate: Date | null;
  approvedBy: string | null;
  notes: string | null;
  familyMembers?: FamilyMember[];
  createdAt: Date;
  updatedAt: Date;
}

export enum SponsorshipStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface Sponsorship {
  id: string;
  businessName: string;
  businessType: string;
  websiteUrl: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  sponsorshipType: string;
  paymentType: PaymentType;
  sponsorshipStatus: SponsorshipStatus;
  applicationDate: Date;
  approvedDate: Date | null;
  approvedBy: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
