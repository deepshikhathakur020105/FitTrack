import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateEnv, validateEnvValues } from './utils/envValidator.js';
import logger from './utils/logger.js';
import { globalLimiter, authLimiter, passwordResetLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware, adminMiddleware } from './middleware/auth.js';

dotenv.config();

// Validate environment variables before starting
validateEnv();
validateEnvValues();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Global Rate Limiter
app.use('/api/', globalLimiter);

// Request Logging Middleware
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.path}`);
  next();
});

// Health Check Route (Not rate limited)
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  };
  res.json(health);
  logger.info('Health check successful');
});

// Public Routes with Auth Rate Limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth', authRoutes);

// Protected Routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);
app.use('/api/admin', authMiddleware, adminMiddleware, adminRoutes);

// 404 Handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error Handler (Must be last)
app.use(errorHandler);

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`✅ FitTrack API running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔐 Security: Helmet + Rate Limiting + Input Validation enabled`);
});

export default app;
