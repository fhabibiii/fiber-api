import { Request, Response, NextFunction, RequestHandler } from 'express';

// Definisi enum Role untuk digunakan seluruh aplikasi
export enum Role {
  ADMIN = 'ADMIN',
  AFFILIATOR = 'AFFILIATOR'
}

// Interface untuk pengguna yang terotentikasi
export interface AuthUser {
  uuid: string;
  role: Role;
}

// Interface untuk memperluas Express Request
export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Interface untuk data customer
export interface CustomerData {
  uuid: string;
  fullName: string;
  phoneNumber: string;
  fullAddress: string;
  affiliatorUuid: string;
  affiliatorName?: string;
  createdAt: Date;
}

// Interface untuk data payment
export interface PaymentData {
  id: number;
  affiliatorUuid: string;
  month: string;
  year: number;
  amount: number;
  paymentDate: Date;
  proofImage?: string;
  createdAt: Date;
}

// Interface untuk query filters
export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
}

// Interface untuk customer query filters
export interface CustomerQuery extends PaginationQuery {
  affiliatorUuid?: string;
}

// Handler khusus untuk AuthRequest
export type AuthRequestHandler = (req: AuthRequest, res: Response, next: NextFunction) => Promise<void> | void;
