
import express from 'express';
import { webController } from '../controllers/webController.js';

const router = express.Router();

router.post('/analyze', webController.analyzeUrl);

export default router;
