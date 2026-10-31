import { Router } from 'express';
import {
  clearDraft,
  createMatch,
  getDraft,
  getHistory,
  recordMatch,
  recoverDraft,
  saveDraft,
} from '../controllers/matchController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Phase 2: Match creation and completion APIs
router.post('/create', createMatch);
router.post('/record', recordMatch);
router.get('/history', getHistory);

// Phase 2 & NFR-04: Disconnect persistence
router.post('/draft', saveDraft);
router.get('/draft', getDraft);
router.delete('/draft', clearDraft);
router.post('/recover', recoverDraft);

export default router;
