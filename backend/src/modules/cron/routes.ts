import { Router } from 'express';
import { sendReminders } from '../../cron-reminders';

const router = Router();

// Endpoint to trigger reminders manually or via external cron
// Add a simple secret check for security
router.post('/trigger-reminders', async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  try {
    await sendReminders();
    return res.status(200).json({ success: true, message: 'Recordatorios procesados' });
  } catch (error) {
    console.error('[Cron] Error processing reminders:', error);
    return res.status(500).json({ success: false, message: 'Error interno al procesar recordatorios' });
  }
});

export default router;
