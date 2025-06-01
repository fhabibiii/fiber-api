import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, Role, AuthUser } from '../types/express';
import authService from '../services/auth.service';
import logger from '../utils/logger';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'No authorization header provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Periksa apakah token sudah di-revoke (logout)
    if (authService.isTokenRevoked(token)) {
      logger.warn(`Attempt to use revoked token: ${token.substring(0, 10)}...`);
      res.status(401).json({ success: false, message: 'Token has been revoked (logged out)' });
      return;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { uuid: string; role: Role };
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    } else {
      res.status(401).json({ success: false, message: 'Authentication failed' });
    }
    return;
  }
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== Role.ADMIN) {
    res.status(403).json({ success: false, message: 'Access denied. Admin role required' });
    return;
  }
  next();
};

export const authorizeAffiliator = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== Role.AFFILIATOR) {
    return res.status(403).json({ success: false, message: 'Access denied. Affiliator role required' });
  }
  next();
};
