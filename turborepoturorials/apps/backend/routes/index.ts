import express from 'express';
const router = express.Router();

import v1 from './v1';

/* GET home page. */
// router.get('/', function(req: express.Request, res: express.Response, next: express.NextFunction) {
//   res.render('index', { title: 'Express' });
// });


router.use('/api/v1', v1);

export default router;