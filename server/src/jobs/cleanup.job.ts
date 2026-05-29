
import cron from 'node-cron';
import * as deadDropService from '../modules/deaddrops/deaddrops.service';

 
/**
 * Start the cleanup cron job
 *
 * Runs every 5 minutes to delete expired dead drops
 * that were never read.
 *
 * Cron expression: 5 * * * * 
 * - Every 5th minute
 * - Every hour
 * - Every day of month
 * - Every month
 * - Every day of week
 */
export function startCleanupJob(): void {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await deadDropService.cleanupExpired();

      if (result.deleted > 0) {
        console.log(
          `[Cleanup] Deleted ${result.deleted} expired dead drop(s)`
        );
      }
    } catch (error) {
      console.error('[Cleanup] Job failed:', error);
    }
  });

  console.log('[Cleanup] Scheduled: every 5 minutes');
}