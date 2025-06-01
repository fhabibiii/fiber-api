import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = schema.parse(req.body);
      req.body = body;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        console.error('Validation error:', formattedErrors);
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: formattedErrors
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        message: 'Invalid input data'
      });
    }
  };
};

// Schemas
export const customerSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 characters'),
  fullAddress: z.string().min(5, 'Address must be at least 5 characters'),
  affiliatorUuid: z.string().uuid('Invalid affiliator UUID format')
});

export const paymentSchema = z.object({
  affiliatorUuid: z.string().uuid('Invalid affiliator UUID format'),
  month: z.string().min(1, 'Month is required'),
  year: z.number().int().positive().or(z.string().regex(/^\d+$/).transform(Number)),
  amount: z.number().positive().or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Date must be in YYYY-MM-DD format'),
  proofImage: z.string().min(1, 'Proof image is required')
});

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const updateCustomerSchema = customerSchema.partial();
export const updatePaymentSchema = paymentSchema.partial();
