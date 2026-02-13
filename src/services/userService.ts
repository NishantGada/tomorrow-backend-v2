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

  // Increment total tasks completed
  async incrementTasksCompleted(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        totalTasksCompleted: {
          increment: 1,
        },
      },
    });
  }

  // Decrement total tasks completed
  async decrementTasksCompleted(userId: string) {
    const user = await this.getUserById(userId);
    if (!user || user.totalTasksCompleted === 0) {
      return user;
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        totalTasksCompleted: {
          decrement: 1,
        },
      },
    });
  }
}

export default new UserService();