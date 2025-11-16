import { Router } from 'express';
import { z } from 'zod';
import { ReportService } from '../services/reportService';
import { requireRoles } from '../lib/auth';

const router = Router();

// GET /api/reports/daily
// Requires date in YYYY-MM-DD format
router.get('/daily', requireRoles('MANAGER', 'ADMIN'), async (req, res) => {
  try {
    const { date } = z
      .object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format') })
      .parse(req.query);

    const report = await ReportService.getDailyReport(date);
    res.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

export default router;