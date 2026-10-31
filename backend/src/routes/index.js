import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import questionRoutes from './questionRoutes.js';
import matchRoutes from './matchRoutes.js';
import leaderboardRoutes from './leaderboardRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Health check endpoint (NFR-01 monitoring)
router.get('/health', (req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/questions', questionRoutes);
router.use('/matches', matchRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/admin', adminRoutes);

export default router;
