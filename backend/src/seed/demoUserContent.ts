import { dateOnlyFromDate, todayDateString } from '../lib/date'
import { toJsonString } from '../lib/json'
import { DEFAULT_POMODORO_SETTINGS } from '../lib/pomodoro-settings'
import { prisma } from '../lib/prisma'

export const DEMO_BOARD_COLUMN_IDS = {
  backlog: 'demo-col-backlog',
  inProgress: 'demo-col-in-progress',
  review: 'demo-col-review',
  done: 'demo-col-done',
} as const

function daysFromNow(days: number, hour = 9): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d
}

function daysAgo(days: number, hour = 10): Date {
  return daysFromNow(-days, hour)
}

function habitDateOffsets(count: number): string[] {
  const today = todayDateString()
  const offsets = Array.from({ length: count }, (_, i) => -(count - 1 - i))
  return offsets.map((offset) => {
    const d = new Date(`${today}T12:00:00`)
    d.setDate(d.getDate() + offset)
    return dateOnlyFromDate(d)
  })
}

export interface DemoListIds {
  inboxId: string
  workId: string
  personalId: string
}

export async function seedDemoUserContent(userId: string, listIds: DemoListIds): Promise<void> {
  const { inboxId, workId, personalId } = listIds
  const cols = DEMO_BOARD_COLUMN_IDS

  const boardColumns = [
    { id: cols.backlog, name: 'Backlog', listId: workId },
    { id: cols.inProgress, name: 'In Progress', listId: workId },
    { id: cols.review, name: 'Review', listId: workId },
    { id: cols.done, name: 'Done', listId: workId },
  ]

  await prisma.userSettings.upsert({
    where: { userId },
    create: {
      userId,
      language: 'vi',
      theme: 'light',
      notifications: true,
      soundEnabled: true,
      autoStartPomodoro: false,
      defaultPriority: 'medium',
      defaultListId: inboxId,
      bottomNavActions: toJsonString(['dashboard', 'list', 'board', 'calendar', 'habit']),
      pomodoroSettingsJson: toJsonString(DEFAULT_POMODORO_SETTINGS),
      boardColumnsJson: toJsonString(boardColumns),
    },
    update: {
      language: 'vi',
      defaultListId: inboxId,
      boardColumnsJson: toJsonString(boardColumns),
      pomodoroSettingsJson: toJsonString(DEFAULT_POMODORO_SETTINGS),
    },
  })

  const taskSpecs = [
    {
      title: 'Chào mừng đến Taskflow 👋',
      description: 'Tài khoản demo — sửa hoặc xóa task này tùy ý.',
      listId: inboxId,
      priority: 'high',
      dueDate: daysFromNow(1),
      tags: ['getting-started'],
      sortOrder: 0,
    },
    {
      title: 'Trả lời email khách hàng',
      description: 'Gửi báo giá và timeline cho dự án Q3.',
      listId: inboxId,
      priority: 'urgent',
      dueDate: daysFromNow(0),
      tags: ['email', 'client'],
      sortOrder: 1,
    },
    {
      title: 'Review PR #42 — auth middleware',
      listId: workId,
      columnId: cols.review,
      priority: 'medium',
      dueDate: daysFromNow(2),
      tags: ['code-review'],
      subtasks: [
        { id: 'st-1', title: 'Kiểm tra test coverage', completed: true },
        { id: 'st-2', title: 'Verify error messages', completed: false },
      ],
      sortOrder: 2,
    },
    {
      title: 'Thiết kế wireframe màn Dashboard',
      listId: workId,
      columnId: cols.inProgress,
      priority: 'high',
      dueDate: daysFromNow(4),
      tags: ['design', 'ui'],
      sortOrder: 3,
    },
    {
      title: 'Viết tài liệu API onboarding',
      listId: workId,
      columnId: cols.backlog,
      priority: 'low',
      dueDate: daysFromNow(7),
      tags: ['docs'],
      sortOrder: 4,
    },
    {
      title: 'Deploy staging build',
      listId: workId,
      columnId: cols.done,
      priority: 'medium',
      completed: true,
      completedAt: daysAgo(1),
      dueDate: daysAgo(1),
      tags: ['devops'],
      sortOrder: 5,
    },
    {
      title: 'Daily standup notes',
      listId: workId,
      columnId: cols.done,
      priority: 'none',
      completed: true,
      completedAt: daysAgo(0),
      recurrence: {
        type: 'daily',
        interval: 1,
        completedDates: habitDateOffsets(5),
      },
      sortOrder: 6,
    },
    {
      title: 'Mua quà sinh nhật',
      listId: personalId,
      priority: 'medium',
      dueDate: daysFromNow(5),
      tags: ['shopping'],
      sortOrder: 7,
    },
    {
      title: 'Đặt lịch khám sức khỏe định kỳ',
      listId: personalId,
      priority: 'low',
      dueDate: daysFromNow(10),
      sortOrder: 8,
    },
    {
      title: 'Đọc sách — Atomic Habits (chương 5)',
      listId: personalId,
      priority: 'low',
      completed: true,
      completedAt: daysAgo(2),
      dueDate: daysAgo(2),
      sortOrder: 9,
    },
    {
      title: 'Task quá hạn (demo)',
      listId: inboxId,
      priority: 'high',
      dueDate: daysAgo(3),
      tags: ['overdue'],
      sortOrder: 10,
    },
    {
      title: 'Theo dõi bug đăng nhập mobile',
      description: 'Xác nhận repro, log lỗi và chốt mức ưu tiên với team.',
      listId: workId,
      columnId: cols.inProgress,
      priority: 'urgent',
      dueDate: daysFromNow(0, 11),
      tags: ['bug', 'mobile'],
      sortOrder: 11,
    },
    {
      title: 'Chuẩn bị agenda sprint review',
      listId: workId,
      columnId: cols.review,
      priority: 'high',
      dueDate: daysFromNow(0, 15),
      tags: ['meeting'],
      sortOrder: 12,
    },
    {
      title: 'Hoàn tất hóa đơn tháng này',
      listId: personalId,
      priority: 'high',
      dueDate: daysAgo(1, 16),
      tags: ['finance'],
      sortOrder: 13,
    },
    {
      title: 'Xác nhận lịch demo với khách hàng',
      listId: inboxId,
      priority: 'urgent',
      dueDate: daysAgo(1, 9),
      tags: ['client', 'schedule'],
      sortOrder: 14,
    },
    {
      title: 'Chỉnh copy landing page',
      listId: workId,
      columnId: cols.backlog,
      priority: 'high',
      dueDate: daysFromNow(0, 17),
      tags: ['marketing', 'copy'],
      sortOrder: 15,
    },
    {
      title: 'Gửi recap sau workshop',
      listId: inboxId,
      priority: 'medium',
      dueDate: daysFromNow(0, 18),
      tags: ['follow-up'],
      sortOrder: 16,
    },
    {
      title: 'Chốt checklist release v0.1',
      listId: workId,
      columnId: cols.done,
      priority: 'medium',
      completed: true,
      completedAt: daysAgo(0, 8),
      dueDate: daysAgo(0, 8),
      tags: ['release'],
      sortOrder: 17,
    },
    {
      title: 'Kiểm tra analytics sau deploy',
      listId: workId,
      columnId: cols.done,
      priority: 'high',
      completed: true,
      completedAt: daysAgo(1, 18),
      dueDate: daysAgo(1, 17),
      tags: ['analytics'],
      sortOrder: 18,
    },
    {
      title: 'Backup ảnh gia đình lên cloud',
      listId: personalId,
      priority: 'low',
      completed: true,
      completedAt: daysAgo(4, 20),
      sortOrder: 19,
    },
    {
      title: 'Tổng hợp note nghiên cứu người dùng',
      listId: workId,
      columnId: cols.done,
      priority: 'medium',
      completed: true,
      completedAt: daysAgo(2, 19),
      dueDate: daysAgo(2, 17),
      tags: ['research'],
      sortOrder: 20,
    },
    {
      title: 'Dọn inbox và phân loại task',
      listId: inboxId,
      priority: 'none',
      completed: true,
      completedAt: daysAgo(0, 7),
      sortOrder: 21,
    },
  ] as const

  const createdTasks: Array<{ id: string; title: string }> = []

  for (const spec of taskSpecs) {
    const task = await prisma.todoTask.create({
      data: {
        userId,
        title: spec.title,
        description: 'description' in spec ? spec.description : null,
        listId: spec.listId,
        columnId: 'columnId' in spec ? spec.columnId : null,
        priority: spec.priority,
        completed: 'completed' in spec ? spec.completed : false,
        completedAt: 'completedAt' in spec ? spec.completedAt : null,
        dueDate: 'dueDate' in spec ? spec.dueDate : null,
        tags: toJsonString('tags' in spec ? spec.tags : []),
        subtasks: toJsonString('subtasks' in spec ? spec.subtasks : []),
        recurrence: 'recurrence' in spec ? toJsonString(spec.recurrence) : null,
        sortOrder: spec.sortOrder,
      },
    })
    createdTasks.push({ id: task.id, title: task.title })
  }

  const focusTask = createdTasks.find((t) => t.title.includes('wireframe')) ?? createdTasks[0]

  const habitSpecs = [
    { name: 'Uống đủ 2L nước', completionCount: 10 },
    { name: 'Đọc sách 20 phút', completionCount: 7 },
    { name: 'Tập thể dục 30 phút', completionCount: 5 },
    { name: 'Thiền 10 phút', completionCount: 4 },
  ]

  const createdHabits: Array<{ id: string }> = []
  for (const habit of habitSpecs) {
    const created = await prisma.habit.create({
      data: {
        userId,
        name: habit.name,
        completions: toJsonString(habitDateOffsets(habit.completionCount)),
      },
    })
    createdHabits.push({ id: created.id })
  }

  const countdownSpecs = [
    { title: 'Ra mắt MVP', targetDate: daysFromNow(45), color: '#3b82f6' },
    { title: 'Du lịch Đà Lạt', targetDate: daysFromNow(62), color: '#10b981' },
    { title: 'Họp retrospective team', targetDate: daysFromNow(14), color: '#f59e0b' },
  ]

  for (const event of countdownSpecs) {
    await prisma.countdownEvent.create({
      data: {
        userId,
        title: event.title,
        targetDate: event.targetDate,
        color: event.color,
      },
    })
  }

  const pomodoroSpecs = [
    { daysAgo: 4, duration: 1500, type: 'focus', taskId: focusTask.id },
    { daysAgo: 4, duration: 300, type: 'short_break' },
    { daysAgo: 3, duration: 1500, type: 'focus', taskId: focusTask.id },
    { daysAgo: 3, duration: 1500, type: 'focus', taskId: focusTask.id },
    { daysAgo: 2, duration: 1500, type: 'focus', habitId: createdHabits[1]?.id },
    { daysAgo: 2, duration: 300, type: 'short_break' },
    { daysAgo: 1, duration: 1500, type: 'focus', taskId: focusTask.id },
    { daysAgo: 1, duration: 900, type: 'long_break' },
    { daysAgo: 0, duration: 1500, type: 'focus', taskId: focusTask.id },
    { daysAgo: 0, duration: 1500, type: 'focus' },
    { daysAgo: 0, duration: 1500, type: 'focus', taskId: focusTask.id },
    { daysAgo: 0, duration: 300, type: 'short_break' },
    { daysAgo: 0, duration: 1500, type: 'focus', habitId: createdHabits[0]?.id },
    { daysAgo: 0, duration: 900, type: 'long_break' },
  ]

  for (const session of pomodoroSpecs) {
    const startTime = daysAgo(session.daysAgo, 14)
    await prisma.pomodoroSession.create({
      data: {
        userId,
        startTime,
        durationSeconds: session.duration,
        type: session.type,
        taskId: 'taskId' in session ? session.taskId : null,
        habitId: 'habitId' in session ? session.habitId : null,
      },
    })
  }
}

export async function clearDemoUserContent(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.todoTask.deleteMany({ where: { userId } }),
    prisma.habit.deleteMany({ where: { userId } }),
    prisma.countdownEvent.deleteMany({ where: { userId } }),
    prisma.pomodoroSession.deleteMany({ where: { userId } }),
  ])
}
