import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import profileController from '../controllers/profileController';

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// All routes are protected
router.use(authenticate);

// Get user profile
router.get('/', profileController.getProfile.bind(profileController));

// Update user profile
router.patch('/', profileController.updateProfile.bind(profileController));

// Upload profile picture
router.post(
  '/picture',
  upload.single('picture'),
  profileController.uploadProfilePicture.bind(profileController)
);

export default router;