import path from 'path';
import fs from 'fs';
import logger from '../utils/logger';

export class UploadService {
  async uploadFile(file: any, type: string) {
    if (!file) {
      throw new Error('File is required');
    }

    if (!['proof', 'avatar'].includes(type)) {
      throw new Error('Invalid file type. Must be either "proof" or "avatar"');
    }

    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate file name
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000000);
    const extension = path.extname(file.name);
    const filename = `${type}-${timestamp}-${random}${extension}`;
    const filepath = path.join(uploadDir, filename);

    logger.info(`Uploading file: ${filename}`);

    // Write file to disk
    try {
      const buffer = file.data;
      fs.writeFileSync(filepath, buffer);
      
      return {
        filename,
        filepath,
        url: `/api/v1/files/${filename}`
      };
    } catch (error) {
      logger.error(`Error uploading file: ${filename}`, error);
      throw new Error('Error saving file');
    }
  }

  async deleteFile(filename: string) {
    if (!filename) {
      throw new Error('Filename is required');
    }

    const filepath = path.join(process.cwd(), 'uploads', filename);

    logger.info(`Deleting file: ${filename}`);

    if (!fs.existsSync(filepath)) {
      throw new Error('File not found');
    }

    try {
      fs.unlinkSync(filepath);
      return true;
    } catch (error) {
      logger.error(`Error deleting file: ${filename}`, error);
      throw new Error('Error deleting file');
    }
  }
}

export default new UploadService();
