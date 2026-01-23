import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db/init.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Configure multer for avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
});

// Upload avatar
router.post('/avatar', authenticateToken, avatarUpload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // Get old avatar to delete later
    const user = db.prepare('SELECT profile_picture FROM users WHERE id = ?').get(req.user.id);
    const oldAvatar = user?.profile_picture;
    
    // Update user's avatar in database
    db.prepare('UPDATE users SET profile_picture = ?, updated_at = datetime("now") WHERE id = ?')
      .run(avatarUrl, req.user.id);

    // Delete old avatar if exists
    if (oldAvatar && oldAvatar !== avatarUrl) {
      const oldPath = path.join(__dirname, '../..', oldAvatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    res.json({ 
      message: 'Avatar uploaded successfully',
      avatarUrl 
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Delete avatar
router.delete('/avatar', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT profile_picture FROM users WHERE id = ?').get(req.user.id);
    
    if (user?.profile_picture) {
      const avatarPath = path.join(__dirname, '../..', user.profile_picture);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    db.prepare('UPDATE users SET profile_picture = NULL, updated_at = datetime("now") WHERE id = ?')
      .run(req.user.id);

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

export default router;
