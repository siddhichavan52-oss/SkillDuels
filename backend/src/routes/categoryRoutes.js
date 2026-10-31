import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from '../controllers/categoryController.js';
import { authenticate, requireAdmin } from '../middlewares/auth.js';
import { validateCategory } from '../middlewares/validate.js';

const router = Router();

// Public read routes
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);

// Admin-protected routes (NFR-03)
router.post('/', authenticate, requireAdmin, validateCategory, createCategory);
router.put('/:id', authenticate, requireAdmin, validateCategory, updateCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

export default router;
