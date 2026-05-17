// server/src/jobs/cleanup.job.ts

 

import cron from 'node-cron';
import { DeadDropService } from '../modules/deaddrops/deaddrops.service';


const deadDropService = new DeadDropService();

/**
 * Run every 5 minutes: clean up expired dead drops
 */
export function startCleanupJob() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const result = await deadDropService.cleanupExpired();
      if (result.deleted > 0) {
        console.log(
          `[Cleanup] Deleted ${result.deleted} expired dead drops`
        );
      }
    } catch (error) {
      console.error('[Cleanup] Error:', error);
    }
  });

  console.log('[Cleanup] Scheduled job: every 5 minutes');
}