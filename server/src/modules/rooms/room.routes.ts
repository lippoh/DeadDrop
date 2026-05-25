import { Router } from 'express';
import * as roomController from './room.controller';

export const roomRoutes = Router();

roomRoutes.post('/', roomController.createRoom);
roomRoutes.get('/', roomController.getRooms);
roomRoutes.post('/:roomId/join', roomController.joinRoom);
roomRoutes.post('/:roomId/leave', roomController.leaveRoom);