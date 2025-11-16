// import { VercelPostgres } from '@vercel/postgres';
import { Task } from '../../packages/taskflow-core/src/types';

// Database connection for production - commented out until package is installed
// const postgres = new VercelPostgres({
//   connectionString: process.env.POSTGRES_URL,
// });

// Mock database for now - replace with real database when @vercel/postgres is installed
const tasks: Task[] = [];

export class DatabaseService {
  // Mock implementation for now - replace with real database when ready
  static async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    try {
      const newTask: Task = {
        ...task,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      
      tasks.push(newTask);
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  static async getTasks(userId: string): Promise<Task[]> {
    try {
      // Mock: return all tasks for now (no user filtering in mock)
      return [...tasks];
    } catch (error) {
      console.error('Failed to get tasks:', error);
      throw error;
    }
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      const taskIndex = tasks.findIndex(t => t.id === id);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }
      
      const updatedTask: Task = {
        ...tasks[taskIndex],
        ...updates,
      };
      
      tasks[taskIndex] = updatedTask;
      return updatedTask;
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  static async deleteTask(id: string): Promise<void> {
    try {
      const taskIndex = tasks.findIndex(t => t.id === id);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }
      
      tasks.splice(taskIndex, 1);
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }
}
