import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuration multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'evidence');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom unique avec timestamp et ID utilisateur
    const userId = (req as AuthenticatedRequest).user?.userId;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}${extension}`;
    cb(null, filename);
  }
});

// Filtres pour les types de fichiers acceptés
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|mkv/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seules les images (JPEG, PNG, GIF) et vidéos (MP4, MOV, AVI, MKV) sont acceptées.'));
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 5 // Maximum 5 fichiers
  }
});

/**
 * Middleware pour l'upload de preuves de match
 */
export const uploadEvidence = upload.array('evidence', 5);

/**
 * Contrôleur pour traiter les fichiers uploadés
 */
export const processUploadedFiles = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    // Générer les URLs des fichiers uploadés
    const fileUrls = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/evidence/${file.filename}`
    }));

    res.json({
      success: true,
      data: {
        files: fileUrls
      },
      message: `${files.length} fichier(s) uploadé(s) avec succès`
    });

  } catch (error) {
    console.error('Erreur upload fichiers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload des fichiers'
    });
  }
};

/**
 * Supprimer un fichier de preuve
 */
export const deleteEvidence = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filename } = req.params;
    const userId = req.user!.userId;

    // Vérifier que le fichier appartient à l'utilisateur
    if (!filename.startsWith(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à supprimer ce fichier'
      });
    }

    const filePath = path.join(process.cwd(), 'uploads', 'evidence', filename);

    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Fichier introuvable'
      });
    }

    // Supprimer le fichier
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Fichier supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression fichier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du fichier'
    });
  }
};