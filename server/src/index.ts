import "dotenv/config";

import { app } from './app';
import { env } from './config/env';
import { startCleanupJob } from './jobs/cleanup.job';


const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`\n  DeadDrop Server\n`);
  console.log(`  Environment: ${env.NODE_ENV}`);
  console.log(`  Port: ${PORT}`);
  console.log(`  CORS: ${env.CORS_ORIGIN}\n`);

  // Start the expired dead drops cleanup job
  startCleanupJob();
});
