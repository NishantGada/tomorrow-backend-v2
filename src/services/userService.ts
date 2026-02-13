import prisma from '../config/database';

export class UserService {
  // Get or create user
  async getOrCreateUser(userId: string, email: string, name?: string) {
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          name,
        },
      });
      console.log('✅ New user created:', email);
    }

    return user;
  }

  // Get user by ID
  async getUserById(userId: string) {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  }
}

export default new UserService();