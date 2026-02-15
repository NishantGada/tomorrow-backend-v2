import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import profileService from '../services/profileService';

export class ProfileController {
  // Get user profile
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const profile = await profileService.getProfile(userId);

      res.status(200).json({
        status: 'success',
        data: profile,
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get profile',
      });
    }
  }

  // Update user profile
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const { name, email } = req.body;

      const updateData: { name?: string; email?: string } = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;

      const profile = await profileService.updateProfile(userId, updateData);

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: profile,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update profile',
      });
    }
  }

  // Upload profile picture
  async uploadProfilePicture(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;

      if (!req.file) {
        res.status(400).json({
          status: 'error',
          message: 'No file uploaded',
        });
        return;
      }

      // Validate file type (only images)
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          status: 'error',
          message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed',
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        res.status(400).json({
          status: 'error',
          message: 'File too large. Maximum size is 5MB',
        });
        return;
      }

      const imageUrl = await profileService.uploadProfilePicture(
        userId,
        req.file.buffer,
        req.file.mimetype
      );

      res.status(200).json({
        status: 'success',
        message: 'Profile picture uploaded successfully',
        data: {
          profilePictureUrl: imageUrl,
        },
      });
    } catch (error) {
      console.error('Upload profile picture error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to upload profile picture',
      });
    }
  }
}

export default new ProfileController();