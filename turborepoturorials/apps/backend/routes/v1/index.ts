import express from 'express';
const router = express.Router();

import adminsRouter from './admin';
import usersRouter from './user';

import { middleware } from '../../service/middleware';

router.use(middleware as express.RequestHandler); 

router.use('/admin', adminsRouter);
router.use('/user', usersRouter);

export default router;