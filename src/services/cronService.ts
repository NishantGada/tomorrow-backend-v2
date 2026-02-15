import cron from 'node-cron';
import prisma from '../config/database';
import { TaskStatus } from '@prisma/client';

export class CronService {
  // Run daily at midnight (00:00)
  startDailyRollover() {
    // Run every day at 00:00 (midnight)
    cron.schedule('0 0 * * *', async () => {
      console.log('🕐 Running daily rollover at midnight...');
      await this.performDailyRollover();
    });

    console.log('✅ Daily rollover cron job scheduled (runs at midnight)');
  }

  // Perform the daily rollover logic
  async performDailyRollover() {
    try {
      // Today = the day that just ended (midnight just passed)
      // Yesterday = the day we're processing
      // Tomorrow = the new day

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      console.log('🔍 DEBUG - now:', now);
      console.log('🔍 DEBUG - today:', today);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      console.log('🔍 DEBUG - yesterday:', yesterday);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log(`📅 Processing rollover for ${yesterday.toDateString()}`);
      console.log(`   Moving incomplete tasks to ${today.toDateString()}`);

      // Get all users
      const users = await prisma.user.findMany();

      for (const user of users) {
        await this.processUserRollover(user.id, yesterday, today, tomorrow);
      }

      console.log('✅ Daily rollover completed successfully');
    } catch (error) {
      console.error('❌ Daily rollover error:', error);
    }
  }

  // Process rollover for a single user
  private async processUserRollover(
    userId: string,
    yesterday: Date,
    today: Date,
    tomorrow: Date
  ) {
    // 1. Get all tasks that were due yesterday (any time during that date)
    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);

    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayTasks = await prisma.task.findMany({
      where: {
        userId,
        targetDate: {
          gte: yesterdayStart,
          lt: todayStart, // Changed from lte to lt (less than today)
        },
        status: {
          in: [TaskStatus.ACTIVE, TaskStatus.COMPLETED],
        },
      },
    });

    if (yesterdayTasks.length === 0) {
      console.log(`  No tasks for user ${userId} on ${yesterday.toDateString()}`);
      return;
    }

    const totalTasks = yesterdayTasks.length;
    const completedTasks = yesterdayTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED
    ).length;
    const wasFullyCompleted = totalTasks === completedTasks;

    // 2. Create daily snapshot
    await prisma.dailySnapshot.create({
      data: {
        userId,
        date: yesterdayStart, // Use normalized date
        totalTasks,
        completedTasks,
        wasFullyCompleted,
      },
    });

    console.log(
      `  📊 Snapshot created: ${completedTasks}/${totalTasks} tasks completed`
    );

    // 3. Update user's day-level streak
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    let newStreak = 0;

    if (wasFullyCompleted) {
      newStreak = user.currentStreak + 1;
      console.log(`  🔥 Streak increased: ${newStreak} days`);
    } else {
      newStreak = 0;
      console.log(`  💔 Streak reset (incomplete tasks)`);
    }

    const newLongestStreak = Math.max(newStreak, user.longestStreak);

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
      },
    });

    // 4. Roll over incomplete tasks to today
    const incompleteTasks = yesterdayTasks.filter(
      (t) => t.status === TaskStatus.ACTIVE
    );

    if (incompleteTasks.length > 0) {
      console.log(`  📋 Rolling over ${incompleteTasks.length} incomplete tasks`);

      for (const task of incompleteTasks) {
        await prisma.task.update({
          where: { id: task.id },
          data: {
            targetDate: todayStart, // Use normalized date
          },
        });
      }
    }
  }

  // Manual trigger for testing (call this from an API endpoint)
  async triggerManualRollover() {
    console.log('🔧 Manual rollover triggered');
    await this.performDailyRollover();
  }
}

export default new CronService();