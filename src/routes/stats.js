import { Router } from 'express';
import { 
  getStats, 
  getMonthlyStats, 
  getWeeklyStats, 
  getDailyStats,
  getCustomRangeStats 
} from '../controllers/StatsController.js';
import { requireAuth } from '../middlewares/authValidator.js';

const router = Router();

// Appliquer l'authentification à toutes les routes
router.use(requireAuth);

// GET overall statistics
router.get("/", getStats);

// GET monthly statistics (last 30 days)
router.get("/monthly", getMonthlyStats);

// GET weekly statistics (last 7 days)
router.get("/weekly", getWeeklyStats);

// GET today's statistics
router.get("/daily", getDailyStats);

// GET custom date range statistics
// Usage: /stats/range?startDate=2024-01-01&endDate=2024-01-31
router.get("/range", getCustomRangeStats);

export { router as statsRouter };
