import { Router } from 'express';
import {
  getGlobalLeaderboard,
  getMyRanks,
  getWeeklyLeaderboard,
} from '../controllers/leaderboardController.js';
import { authenticate, optionalAuthenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/global', optionalAuthenticate, getGlobalLeaderboard);
router.get('/weekly', optionalAuthenticate, getWeeklyLeaderboard);
router.get('/me', authenticate, getMyRanks);

export default router;
