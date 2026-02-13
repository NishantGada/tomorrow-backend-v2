import Groq from 'groq-sdk';
import prisma from '../config/database';
import { TaskCategory } from '@prisma/client';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export class SummaryService {
  // Generate task summary using Groq LLM
  private async generateSummaryWithLLM(tasks: any[]): Promise<string> {
    if (tasks.length === 0) {
      return "You have no tasks for tomorrow! Enjoy your free time or add some goals to tackle. 🎯";
    }

    // Group tasks by category
    const redTasks = tasks.filter(t => t.category === TaskCategory.RED);
    const yellowTasks = tasks.filter(t => t.category === TaskCategory.YELLOW);
    const greenTasks = tasks.filter(t => t.category === TaskCategory.GREEN);

    // Build task list for LLM
    const taskList = tasks.map(t =>
      `- [${t.category}] ${t.title}${t.description ? `: ${t.description}` : ''}`
    ).join('\n');

    const prompt = `Analyze this task list and provide a motivational summary.
  
  TASKS FOR TOMORROW:
  ${taskList}
  
  PRIORITY COUNTS:
  - RED (Urgent): ${redTasks.length}
  - YELLOW (Important): ${yellowTasks.length}  
  - GREEN (Optional): ${greenTasks.length}
  
  INSTRUCTIONS:
  Write exactly 2-3 sentences following this structure:
  
  Sentence 1: Acknowledge the workload. Example: "Tomorrow looks busy with 1 urgent task and 2 important ones!"
  
  Sentence 2: Give ONE specific tip based on their actual task titles. Examples:
  - "Tackle the API work first thing when your energy is highest."
  - "If the client meeting prep runs long, consider moving the documentation reading to another day."
  - "Focus on the urgent bug fix before diving into the presentation slides."
  
  Sentence 3: End with encouragement. Example: "You've got this! 💪"
  
  Keep it under 50 words total. Be SPECIFIC to their tasks, not generic.`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a concise productivity coach. Follow instructions exactly. Be specific, not generic.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        temperature: 0.5, // Lower temperature for more focused responses
        max_tokens: 150,
      });

      return completion.choices[0]?.message?.content?.replace(/"/g, '') || 'Ready to tackle tomorrow! 💪';
    } catch (error) {
      console.error('Groq API error:', error);
      return `You have ${redTasks.length} urgent, ${yellowTasks.length} important, and ${greenTasks.length} optional tasks tomorrow. Focus on urgent tasks first! 💪`;
    }
  }

  // Get or generate summary for a specific date
  async getSummary(userId: string, targetDate: Date) {
    // Get all active tasks for the target date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        targetDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'ACTIVE',
      },
      orderBy: [
        { category: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Create snapshot hash to detect changes
    const tasksSnapshot = tasks.map(t => ({
      id: t.id,
      title: t.title,
      category: t.category,
    }));

    // Check if we have a cached summary
    const existingSummary = await prisma.taskSummary.findUnique({
      where: {
        userId_targetDate: {
          userId,
          targetDate: startOfDay,
        },
      },
    });

    // Compare snapshots - regenerate if tasks changed
    const snapshotChanged = !existingSummary ||
      JSON.stringify(existingSummary.tasksSnapshot) !== JSON.stringify(tasksSnapshot);

    if (snapshotChanged) {
      // Generate new summary
      const summaryText = await this.generateSummaryWithLLM(tasks);

      // Save to database
      const savedSummary = await prisma.taskSummary.upsert({
        where: {
          userId_targetDate: {
            userId,
            targetDate: startOfDay,
          },
        },
        update: {
          summary: summaryText,
          tasksSnapshot,
        },
        create: {
          userId,
          targetDate: startOfDay,
          summary: summaryText,
          tasksSnapshot,
        },
      });

      return {
        summary: savedSummary.summary,
        targetDate: savedSummary.targetDate,
        taskCount: tasks.length,
        createdAt: savedSummary.createdAt,
        regenerated: true,
      };
    }

    // Return cached summary
    return {
      summary: existingSummary.summary,
      targetDate: existingSummary.targetDate,
      taskCount: tasks.length,
      createdAt: existingSummary.createdAt,
      regenerated: false,
    };
  }

  // Force regenerate summary
  async regenerateSummary(userId: string, targetDate: Date) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Delete existing summary to force regeneration
    await prisma.taskSummary.deleteMany({
      where: {
        userId,
        targetDate: startOfDay,
      },
    });

    return await this.getSummary(userId, startOfDay);
  }
}

export default new SummaryService();