import { Router, Request, Response } from 'express';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', (req: Request, res: Response) =>
  authController.register(req, res)
);
router.post('/login', (req: Request, res: Response) =>
  authController.login(req, res)
);

export const authRoutes = router;