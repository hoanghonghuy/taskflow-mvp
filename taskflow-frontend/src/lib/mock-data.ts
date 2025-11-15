import type { Task, List, Column, Habit, CountdownEvent, Priority } from '@/types'

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0]

export function generateMockData() {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  const nextWeek = new Date()
  nextWeek.setDate(today.getDate() + 7)
  const dayBeforeYesterday = new Date()
  dayBeforeYesterday.setDate(today.getDate() - 2)
  const lastWeek = new Date()
  lastWeek.setDate(today.getDate() - 7)
  const nextMonth = new Date()
  nextMonth.setMonth(today.getMonth() + 1)
  const nextYear = new Date()
  nextYear.setFullYear(today.getFullYear() + 1)
  nextYear.setMonth(11)
  nextYear.setDate(31)

  const mockLists: List[] = [
    { id: 'inbox', name: 'Inbox', color: '#6b7280', members: ['user-001'] },
    { id: 'list-1', name: 'Work', color: '#3b82f6', members: ['user-001', 'user-002'] },
    { id: 'list-2', name: 'Personal', color: '#10b981', members: ['user-001'] },
    { id: 'list-3', name: 'Shopping', color: '#f59e0b', members: ['user-001', 'user-003'] },
    { id: 'list-4', name: 'Health & Fitness', color: '#ef4444', members: ['user-001'] },
    { id: 'list-5', name: 'Learning', color: '#8b5cf6', members: ['user-001'] },
  ]
  
  // Note: Template uses 'bg-blue-500' format for colors, but we use hex colors
  // This is fine as long as the UI components handle it correctly

  const mockColumns: Column[] = [
    { id: 'col-inbox-1', name: 'To Do', listId: 'inbox' },
    { id: 'col-inbox-2', name: 'In Progress', listId: 'inbox' },
    { id: 'col-inbox-3', name: 'Done', listId: 'inbox' },
    { id: 'col-list-1-1', name: 'To Do', listId: 'list-1' },
    { id: 'col-list-1-2', name: 'In Progress', listId: 'list-1' },
    { id: 'col-list-1-3', name: 'Review', listId: 'list-1' },
    { id: 'col-list-1-4', name: 'Done', listId: 'list-1' },
    { id: 'col-list-2-1', name: 'To Buy', listId: 'list-3' },
    { id: 'col-list-2-2', name: 'Purchased', listId: 'list-3' },
  ]

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Finalize quarterly report',
      description: 'Compile all data and finalize the Q3 report for the review meeting. Include sales metrics, marketing performance, and budget analysis.',
      completed: false,
      dueDate: tomorrow.toISOString(),
      priority: 'high' as Priority,
      listId: 'list-1',
      columnId: 'col-list-1-2',
      tags: ['reporting', 'urgent'],
      subtasks: [
        { id: 's-1', title: 'Gather sales data', completed: true },
        { id: 's-2', title: 'Get marketing feedback', completed: false },
        { id: 's-3', title: 'Review budget numbers', completed: false },
      ],
      createdAt: lastWeek.toISOString(),
      totalFocusTime: 3600,
      assigneeId: 'user-002',
      comments: [
        {
          id: 'c-1',
          userId: 'user-002',
          content: "I'll get the marketing feedback by EOD.",
          timestamp: yesterday.toISOString(),
        },
      ],
    },
    {
      id: 'task-2',
      title: 'Call the vet for appointment',
      description: 'Schedule annual checkup for Max',
      completed: false,
      dueDate: today.toISOString(),
      priority: 'medium' as Priority,
      listId: 'list-2',
      tags: ['health'],
      subtasks: [],
      createdAt: yesterday.toISOString(),
      totalFocusTime: 0,
      comments: [],
    },
    {
      id: 'task-3',
      title: 'Buy groceries',
      description: 'Milk, bread, eggs, cheese, chicken, vegetables',
      completed: true,
      completedAt: yesterday.toISOString(),
      dueDate: yesterday.toISOString(),
      priority: 'low' as Priority,
      listId: 'list-3',
      columnId: 'col-list-2-2',
      tags: [],
      subtasks: [],
      createdAt: dayBeforeYesterday.toISOString(),
      totalFocusTime: 0,
      assigneeId: 'user-003',
      comments: [],
    },
    {
      id: 'task-4',
      title: 'Daily Standup Meeting',
      description: 'Quick sync with the team about progress and blockers',
      completed: false,
      dueDate: today.toISOString(),
      priority: 'medium' as Priority,
      listId: 'list-1',
      columnId: 'col-list-1-1',
      tags: ['meeting'],
      subtasks: [],
      createdAt: lastWeek.toISOString(),
      totalFocusTime: 0,
      recurrence: { type: 'daily', interval: 1 },
      comments: [],
    },
    {
      id: 'task-5',
      title: 'Pay electricity bill',
      description: 'Due by the end of the week. Check online payment portal.',
      completed: false,
      dueDate: nextWeek.toISOString(),
      priority: 'high' as Priority,
      listId: 'inbox',
      columnId: 'col-inbox-1',
      tags: ['bills', 'finance'],
      subtasks: [],
      createdAt: yesterday.toISOString(),
      totalFocusTime: 0,
      comments: [],
    },
    {
      id: 'task-6',
      title: 'Research new project ideas',
      description: 'Explore potential side projects and startup ideas',
      completed: false,
      priority: 'low' as Priority,
      listId: 'list-1',
      columnId: 'col-list-1-1',
      tags: ['research', 'ideas'],
      subtasks: [],
      createdAt: lastWeek.toISOString(),
      totalFocusTime: 7200,
      assigneeId: 'user-001',
      comments: [],
    },
    {
      id: 'task-7',
      title: 'Schedule dentist appointment',
      description: 'Regular cleaning and checkup',
      completed: true,
      completedAt: today.toISOString(),
      priority: 'none' as Priority,
      listId: 'list-2',
      tags: ['health'],
      subtasks: [],
      createdAt: dayBeforeYesterday.toISOString(),
      totalFocusTime: 0,
      comments: [],
    },
    {
      id: 'task-8',
      title: 'Renew gym membership',
      description: 'Membership expires next month. Check for early renewal discounts.',
      completed: false,
      dueDate: nextMonth.toISOString(),
      priority: 'medium' as Priority,
      listId: 'list-4',
      tags: ['fitness'],
      subtasks: [],
      createdAt: yesterday.toISOString(),
      totalFocusTime: 0,
      comments: [],
    },
    {
      id: 'task-9',
      title: 'Submit TPS reports',
      description: 'Remember the new cover sheet. Include all quarterly data.',
      completed: false,
      dueDate: yesterday.toISOString(),
      priority: 'high' as Priority,
      listId: 'list-1',
      columnId: 'col-list-1-3',
      tags: ['reporting'],
      subtasks: [],
      createdAt: lastWeek.toISOString(),
      totalFocusTime: 0,
      assigneeId: 'user-002',
      comments: [],
    },
    {
      id: 'task-10',
      title: 'Complete React course module 5',
      description: 'Advanced hooks and context API',
      completed: false,
      dueDate: nextWeek.toISOString(),
      priority: 'medium' as Priority,
      listId: 'list-5',
      tags: ['learning', 'react'],
      subtasks: [
        { id: 's-4', title: 'Watch video lectures', completed: true },
        { id: 's-5', title: 'Complete exercises', completed: false },
        { id: 's-6', title: 'Submit assignment', completed: false },
      ],
      createdAt: lastWeek.toISOString(),
      totalFocusTime: 5400,
      comments: [],
    },
    {
      id: 'task-11',
      title: 'Plan weekend trip',
      description: 'Research hotels and activities',
      completed: false,
      dueDate: nextWeek.toISOString(),
      priority: 'low' as Priority,
      listId: 'list-2',
      tags: ['travel'],
      subtasks: [],
      createdAt: yesterday.toISOString(),
      totalFocusTime: 0,
      comments: [],
    },
    {
      id: 'task-12',
      title: 'Review code pull requests',
      description: 'Check pending PRs from team members',
      completed: false,
      dueDate: today.toISOString(),
      priority: 'high' as Priority,
      listId: 'list-1',
      columnId: 'col-list-1-2',
      tags: ['code', 'review'],
      subtasks: [],
      createdAt: yesterday.toISOString(),
      totalFocusTime: 1800,
      comments: [],
    },
    {
      id: 'task-13',
      title: 'Update portfolio website',
      description: 'Add recent projects and update skills section',
      completed: false,
      priority: 'medium' as Priority,
      listId: 'list-1',
      columnId: 'col-list-1-1',
      tags: ['portfolio', 'web'],
      subtasks: [],
      createdAt: lastWeek.toISOString(),
      totalFocusTime: 2400,
      comments: [],
    },
    {
      id: 'task-14',
      title: 'Organize home office',
      description: 'Clean desk, organize cables, update setup',
      completed: true,
      completedAt: dayBeforeYesterday.toISOString(),
      dueDate: dayBeforeYesterday.toISOString(),
      priority: 'low' as Priority,
      listId: 'list-2',
      tags: ['home'],
      subtasks: [],
      createdAt: lastWeek.toISOString(),
      totalFocusTime: 0,
      comments: [],
    },
    {
      id: 'task-15',
      title: 'Prepare presentation for client',
      description: 'Create slides for Q4 strategy presentation',
      completed: false,
      dueDate: tomorrow.toISOString(),
      priority: 'high' as Priority,
      listId: 'list-1',
      columnId: 'col-list-1-2',
      tags: ['presentation', 'client'],
      subtasks: [
        { id: 's-7', title: 'Gather data', completed: true },
        { id: 's-8', title: 'Create slides', completed: false },
        { id: 's-9', title: 'Practice presentation', completed: false },
      ],
      createdAt: yesterday.toISOString(),
      totalFocusTime: 4200,
      comments: [],
    },
    {
      id: 'task-16',
      title: 'Design new landing page',
      description: 'Create mockups and wireframes for the new product landing page',
      completed: false,
      dueDate: tomorrow.toISOString(),
      priority: 'high' as Priority,
      listId: 'list-1',
      columnId: 'col-list-1-1',
      tags: ['design', 'ui/ux'],
      subtasks: [
        { id: 's-10', title: 'Research competitor designs', completed: true },
        { id: 's-11', title: 'Create wireframes', completed: false },
        { id: 's-12', title: 'Design mockups', completed: false },
      ],
      createdAt: yesterday.toISOString(),
      totalFocusTime: 3000,
      assigneeId: 'user-001',
      comments: [],
    },
    {
      id: 'task-17',
      title: 'Write blog post about productivity',
      description: 'Share tips and tricks for staying productive while working from home',
      completed: false,
      dueDate: nextWeek.toISOString(),
      priority: 'medium' as Priority,
      listId: 'list-1',
      columnId: 'col-list-1-1',
      tags: ['writing', 'blog'],
      subtasks: [],
      createdAt: lastWeek.toISOString(),
      totalFocusTime: 1500,
      comments: [],
    },
    {
      id: 'task-18',
      title: 'Fix critical bug in payment system',
      description: 'Users are unable to complete transactions. Investigate and fix immediately.',
      completed: false,
      dueDate: today.toISOString(),
      priority: 'urgent' as Priority,
      listId: 'list-1',
      columnId: 'col-list-1-2',
      tags: ['bug', 'urgent', 'critical'],
      subtasks: [
        { id: 's-13', title: 'Reproduce the issue', completed: true },
        { id: 's-14', title: 'Identify root cause', completed: false },
        { id: 's-15', title: 'Write fix and test', completed: false },
      ],
      createdAt: yesterday.toISOString(),
      totalFocusTime: 2400,
      assigneeId: 'user-002',
      comments: [
        {
          id: 'c-2',
          userId: 'user-001',
          content: 'This needs to be fixed ASAP!',
          timestamp: yesterday.toISOString(),
        },
      ],
    },
  ]

  const allMockTags = new Set<string>()
  mockTasks.forEach((task) => task.tags.forEach((tag) => allMockTags.add(tag)))

  const mockHabits: Habit[] = [
    {
      id: 'habit-1',
      name: 'Read for 15 minutes',
      completions: [toYYYYMMDD(yesterday), toYYYYMMDD(dayBeforeYesterday), toYYYYMMDD(lastWeek)],
      createdAt: lastWeek.toISOString(),
    },
    {
      id: 'habit-2',
      name: 'Drink 8 glasses of water',
      completions: [toYYYYMMDD(yesterday), toYYYYMMDD(dayBeforeYesterday)],
      createdAt: lastWeek.toISOString(),
    },
    {
      id: 'habit-3',
      name: 'Exercise for 30 minutes',
      completions: [toYYYYMMDD(yesterday)],
      createdAt: lastWeek.toISOString(),
    },
    {
      id: 'habit-4',
      name: 'Meditate for 10 minutes',
      completions: [toYYYYMMDD(today), toYYYYMMDD(yesterday)],
      createdAt: lastWeek.toISOString(),
    },
    {
      id: 'habit-5',
      name: 'Write in journal',
      completions: [toYYYYMMDD(yesterday)],
      createdAt: lastWeek.toISOString(),
    },
  ]

  const mockCountdowns: CountdownEvent[] = [
    {
      id: 'cd-1',
      title: "New Year's Eve",
      targetDate: nextYear.toISOString(),
      color: 'bg-blue-500',
    },
    {
      id: 'cd-2',
      title: 'Project Deadline',
      targetDate: nextMonth.toISOString(),
      color: 'bg-red-500',
    },
    {
      id: 'cd-3',
      title: 'Vacation',
      targetDate: nextWeek.toISOString(),
      color: 'bg-green-500',
    },
  ]

  // Generate focus history for pomodoro
  const mockFocusHistory = []
  for (let i = 0; i < 30; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const sessions = Math.floor(Math.random() * 5) + 1
    for (let j = 0; j < sessions; j++) {
      mockFocusHistory.push({
        startTime: new Date(date.getTime() + j * 25 * 60 * 1000).toISOString(),
        duration: 25 * 60,
        taskId: mockTasks[Math.floor(Math.random() * mockTasks.length)].id,
      })
    }
  }

  return {
    tasks: mockTasks,
    lists: mockLists,
    columns: mockColumns,
    habits: mockHabits,
    countdownEvents: mockCountdowns,
    tags: Array.from(allMockTags).sort(),
    focusHistory: mockFocusHistory,
  }
}

