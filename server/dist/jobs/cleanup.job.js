"use strict";
// server/src/jobs/cleanup.job.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCleanupJob = startCleanupJob;
const node_cron_1 = __importDefault(require("node-cron"));
const deaddrops_service_1 = require("../modules/deaddrops/deaddrops.service");
const deadDropService = new deaddrops_service_1.DeadDropService();
/**
 * Run every 5 minutes: clean up expired dead drops
 */
function startCleanupJob() {
    node_cron_1.default.schedule('*/5 * * * *', async () => {
        try {
            const result = await deadDropService.cleanupExpired();
            if (result.deleted > 0) {
                console.log(`[Cleanup] Deleted ${result.deleted} expired dead drops`);
            }
        }
        catch (error) {
            console.error('[Cleanup] Error:', error);
        }
    });
    console.log('[Cleanup] Scheduled job: every 5 minutes');
}
//# sourceMappingURL=cleanup.job.js.map