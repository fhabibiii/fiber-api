import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AuthRequest, AuthUser } from '../types/express';
import authService from '../services/auth.service';
import logger from '../utils/logger';

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: 'Username and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    // Generate tokens dengan masa berlaku 15 detik sesuai keinginan user
    const token = jwt.sign(
      { uuid: user.uuid, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '15s' }
    );

    const refreshToken = jwt.sign(
      { uuid: user.uuid },
      process.env.JWT_REFRESH_SECRET as string,
      { expiresIn: '1d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};

export const refresh = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'Refresh token is required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { uuid: string };
    
    const user = await prisma.user.findUnique({
      where: { uuid: decoded.uuid }
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    const newToken = jwt.sign(
      { uuid: user.uuid, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '15s' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      token: newToken,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    return;
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(400).json({ success: false, message: 'No token provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Tambahkan token ke daftar token yang direvoke
    authService.revokeToken(token);
    
    logger.info('User logged out successfully');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
    return;
  } catch (error) {
    logger.error('Logout error', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
    return;
  }
};
