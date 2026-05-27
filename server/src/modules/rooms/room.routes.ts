import { Router } from 'express';
import * as roomController from './room.controller';

export const roomRoutes = Router();

roomRoutes.post('/', roomController.createRoom);
roomRoutes.get('/', roomController.getRooms);
roomRoutes.post('/:roomId/join', roomController.joinRoom);
roomRoutes.post('/:roomId/leave', roomController.leaveRoom);
roomRoutes.get('/:roomId/members', roomController.getRoomMembers);

// Room settings
roomRoutes.patch('/:roomId/name', roomController.renameRoom);
roomRoutes.delete('/:roomId', roomController.deleteRoom);
roomRoutes.delete('/:roomId/members/:userId', roomController.kickMember);