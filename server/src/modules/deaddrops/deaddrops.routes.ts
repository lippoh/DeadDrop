import { Router } from 'express';
import * as deadDropController from './deaddrops.controller';

export const deadDropRoutes = Router();

deadDropRoutes.post('/', deadDropController.createDrop);
deadDropRoutes.get('/:token', deadDropController.getDrop);
deadDropRoutes.post('/:token/data', deadDropController.getDropData);
deadDropRoutes.post('/:token/read', deadDropController.readDrop);