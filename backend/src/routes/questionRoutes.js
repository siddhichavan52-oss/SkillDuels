import { Router } from 'express';
import {
  createQuestion,
  deleteQuestion,
  getQuestions,
  setQuestionStatus,
  updateQuestion,
} from '../controllers/questionController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { validateQuestion } from '../middlewares/validate.js';

const router = Router();

// Protected admin questions endpoints (NFR-03)
router.get('/', authenticate, requireAdmin, getQuestions);
router.post('/', authenticate, requireAdmin, validateQuestion, createQuestion);
router.put('/:id', authenticate, requireAdmin, validateQuestion, updateQuestion);
router.patch('/:id/status', authenticate, requireAdmin, setQuestionStatus);
router.delete('/:id', authenticate, requireAdmin, deleteQuestion);

export default router;
