import prisma from '../utils/prisma';
import { Role } from '../types/express';
import logger from '../utils/logger';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Set untuk menyimpan token yang telah direvoke/logout
const revokedTokens = new Set<string>();

export class AuthService {
  /**
   * Memeriksa apakah token sudah direvoke (logout)
   */
  isTokenRevoked(token: string): boolean {
    return revokedTokens.has(token);
  }
  
  /**
   * Menambahkan token ke daftar token yang sudah direvoke (logout)
   */
  revokeToken(token: string): void {
    revokedTokens.add(token);
    logger.info(`Token direvoke/logout berhasil`);
    
    // Jika terlalu banyak token tersimpan, bisa dibersihkan secara berkala
    // dengan implementasi yang lebih kompleks menggunakan timestamp
  }
  
  async login(username: string, password: string) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }

    logger.info(`Attempting login for user: ${username}`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      logger.warn(`Login failed: User ${username} not found`);
      throw new Error('Invalid credentials');
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      logger.warn(`Login failed: Invalid password for user ${username}`);
      throw new Error('Invalid credentials');
    }

    // Generate tokens dengan masa berlaku 15 detik
    const token = jwt.sign({ uuid: user.uuid, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '15s' });
    const refreshToken = jwt.sign({ uuid: user.uuid }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '1d' });

    logger.info(`User ${username} logged in successfully`);

    return {
      uuid: user.uuid,
      fullName: user.fullName,
      role: user.role,
      token,
      refreshToken
    };
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { uuid: string };
      
      // Get user
      const user = await prisma.user.findUnique({
        where: { uuid: decoded.uuid }
      });

      if (!user) {
        throw new Error('Invalid token');
      }

      // Generate new access token
      const newToken = jwt.sign({ uuid: user.uuid, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '15s' });
      
      logger.info(`Generated new token for user: ${user.username}`);

      return {
        token: newToken
      };
    } catch (error) {
      logger.error('Error refreshing token', error);
      throw new Error('Invalid token');
    }
  }
}

export default new AuthService();

// Membersihkan revokedTokens secara berkala (setiap 1 jam)
// Ini membantu menghindari memory leak karena terlalu banyak token yang disimpan
setInterval(() => {
  const oldSize = revokedTokens.size;
  // Dalam implementasi yang lebih baik, kita akan menyimpan timestamp revoke
  // dan hanya menghapus token yang sudah expired
  // Tapi untuk sederhananya, kita kosongkan seluruhnya setiap jam
  revokedTokens.clear();
  logger.info(`Cleared ${oldSize} revoked tokens from memory`);
}, 60 * 60 * 1000); // 1 jam
