import { NextApiRequest, NextApiResponse } from 'next';
import type { Task } from '@/types';

// Mock database - replace with real database in production
const tasks: Task[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          const task = tasks.find(t => t.id === id);
          if (!task) {
            return res.status(404).json({ error: 'Task not found' });
          }
          return res.status(200).json(task);
        } else {
          return res.status(200).json(tasks);
        }

      case 'POST':
        const newTask: Omit<Task, 'id'> = req.body;
        const task: Task = {
          ...newTask,
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };
        tasks.push(task);
        return res.status(201).json(task);

      case 'PUT':
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Task ID is required' });
        }
        
        const taskIndex = tasks.findIndex(t => t.id === id);
        if (taskIndex === -1) {
          return res.status(404).json({ error: 'Task not found' });
        }

        const updatedTask: Task = {
          ...tasks[taskIndex],
          ...req.body,
          updatedAt: new Date().toISOString(),
        };
        tasks[taskIndex] = updatedTask;
        return res.status(200).json(updatedTask);

      case 'DELETE':
        if (!id || typeof id !== 'string') {
          return res.status(400).json({ error: 'Task ID is required' });
        }

        const deleteIndex = tasks.findIndex(t => t.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Task not found' });
        }

        tasks.splice(deleteIndex, 1);
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
