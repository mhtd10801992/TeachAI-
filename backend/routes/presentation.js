import express from 'express';
import { generatePresentationSlides } from '../controllers/presentationController.js';

const router = express.Router();

// Generate presentation slides
router.post('/generate', generatePresentationSlides);

export default router;
