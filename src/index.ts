import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import logger from './utils/logger';
import authRoutes from './routes/auth.routes';
import affiliatorRoutes from './routes/affiliator.routes';
import customerRoutes from './routes/customer.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import affiliatorUserRoutes from './routes/affiliatorUser.routes';
import uploadRoutes from './routes/upload.routes';
import fileRoutes from './routes/file.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middlewares
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  logger.logRequest(req.method, req.path, req.ip || 'unknown');
  next();
});

// Serve static files from the uploads directory
app.use('/api/v1/files', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/affiliators', affiliatorRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/payment', paymentRoutes); // Add singular version for compatibility
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/affiliator', affiliatorUserRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/files', fileRoutes);

// Base route
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Welcome to Fibernode Affiliate API',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
