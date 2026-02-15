import AWS from 'aws-sdk';
import prisma from '../config/database';
import { randomUUID } from 'crypto';

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export class ProfileService {
  // Upload profile picture to S3
  async uploadProfilePicture(
    userId: string,
    fileBuffer: Buffer,
    mimeType: string
  ): Promise<string> {
    // Generate unique filename
    const fileExtension = mimeType.split('/')[1];
    const fileName = `${userId}-${randomUUID()}.${fileExtension}`;

    // S3 upload parameters
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: `profile-pictures/${fileName}`,
      Body: fileBuffer,
      ContentType: mimeType,
    };

    try {
      // Upload to S3
      const result = await s3.upload(params).promise();
      const imageUrl = result.Location;

      // Update user's profile picture URL in database
      await prisma.user.update({
        where: { id: userId },
        data: { profilePictureUrl: imageUrl },
      });

      return imageUrl;
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload profile picture');
    }
  }

  // Update user profile
  async updateProfile(
    userId: string,
    data: {
      name?: string;
      email?: string;
    }
  ) {
    return await prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  // Get user profile
  async getProfile(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        profilePictureUrl: true,
        currentStreak: true,
        longestStreak: true,
        totalTasksCompleted: true,
      },
    });
  }
}

export default new ProfileService();