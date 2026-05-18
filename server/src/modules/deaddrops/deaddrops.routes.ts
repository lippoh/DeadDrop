

import { Router } from 'express';
import {
  createDeadDrop,
  getDeadDrop,
  readDeadDrop,
} from './deaddrops.controller';


const router = Router();

/**
 * Dead Drop API Routes
 *
 * POST   /api/drops           Create a new dead drop
 * GET    /api/drops/:token    Check if a dead drop exists
 * POST   /api/drops/:token/read  Read and destroy a dead drop
 */

// Create a new dead drop (encryption happens client-side)
router.post('/', createDeadDrop);

// Check if a dead drop exists (metadata only, no ciphertext)
router.get('/:token', getDeadDrop);

// Read and immediately destroy a dead drop
router.post('/:token/read', readDeadDrop);

export const deadDropRoutes = router;
