import express from 'express';
import { uploadEvidence, processUploadedFiles, deleteEvidence } from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Upload de preuves pour les matches
router.post('/evidence', authenticateToken, uploadEvidence, processUploadedFiles);

// Supprimer une preuve
router.delete('/evidence/:filename', authenticateToken, deleteEvidence);

export default router;