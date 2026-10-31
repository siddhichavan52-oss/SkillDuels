import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import apiRoutes from './routes/index.js';

const app = express();

// Security Headers (NFR-02)
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Performance: Response compression (NFR-01)
app.use(compression());

// Body parser with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global rate limiting (NFR-02)
app.use('/api', apiLimiter);

// Mount main API routes
app.use('/api', apiRoutes);

// Root greeting & info
app.get('/', (req, res) => {
  res.json({
    name: 'SkillDuels API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Error handling middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
