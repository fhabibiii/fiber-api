import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';

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

// Port
const PORT = Number(process.env.PORT) || 3001;

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, '../uploads');
if (!require('fs').existsSync(uploadDir)) {
  require('fs').mkdirSync(uploadDir, { recursive: true });
}

// Middlewares
app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  logger.logRequest(req.method, req.path, req.ip || 'unknown');
  next();
});

// Static files
app.use('/api/v1/files', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/affiliators', affiliatorRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/payment', paymentRoutes);
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

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Server error', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Jalankan HTTP server
const server = http.createServer(app);
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} (HTTP only)`);
});
