import express from 'express';
import rpc from './rpc';
import execution from './execution';

const router = express.Router();

router.use('/rpc', rpc);
router.use('/execution', execution);

export default router;
