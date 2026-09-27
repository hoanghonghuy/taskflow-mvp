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

  await seedExpandedDemoUserContent(userId, listIds)
}

export async function seedExpandedDemoUserContent(
  userId: string,
  listIds: DemoListIds,
): Promise<void> {
  const { inboxId, workId, personalId } = listIds
  const cols = DEMO_BOARD_COLUMN_IDS

  const existingTaskTitles = new Set(
    (
      await prisma.todoTask.findMany({
        where: { userId },
        select: { title: true },
      })
    ).map((task) => task.title),
  )

  const expandedTaskSpecs = [
    {
      title: 'Lập kế hoạch roadmap tháng tới',
      description: 'Chốt mục tiêu, phạm vi MVP tiếp theo và các mốc bàn giao.',
      listId: workId,
      columnId: cols.backlog,
      priority: 'high',
      dueDate: daysFromNow(3, 10),
      tags: ['planning', 'roadmap'],
      subtasks: [
        { id: 'st-roadmap-1', title: 'Tổng hợp feedback từ demo user', completed: true },
        { id: 'st-roadmap-2', title: 'Ưu tiên 5 việc quan trọng nhất', completed: false },
      ],
      sortOrder: 22,
    },
    {
      title: 'Gọi nhà cung cấp Internet',
      listId: personalId,
      priority: 'medium',
      dueDate: daysFromNow(1, 16),
      tags: ['personal', 'call'],
      sortOrder: 23,
    },
    {
      title: 'Kiểm thử flow đăng ký tài khoản',
      listId: workId,
      columnId: cols.inProgress,
      priority: 'urgent',
      dueDate: daysFromNow(0, 20),
      tags: ['qa', 'auth'],
      sortOrder: 24,
    },
    {
      title: 'Chuẩn bị nội dung bài viết LinkedIn',
      listId: workId,
      columnId: cols.review,
      priority: 'medium',
      dueDate: daysFromNow(2, 14),
      tags: ['content', 'marketing'],
      sortOrder: 25,
    },
    {
      title: 'Sắp xếp lại góc làm việc',
      listId: personalId,
      priority: 'low',
      dueDate: daysFromNow(6, 9),
      tags: ['home'],
      sortOrder: 26,
    },
    {
      title: 'Tạo checklist backup dữ liệu',
      listId: inboxId,
      priority: 'high',
      dueDate: daysFromNow(4, 11),
      tags: ['ops', 'backup'],
      sortOrder: 27,
    },
    {
      title: 'Phân tích task bị trễ tuần này',
      listId: workId,
      columnId: cols.done,
      priority: 'medium',
      completed: true,
      completedAt: daysAgo(0, 12),
      dueDate: daysAgo(0, 11),
      tags: ['analytics'],
      sortOrder: 28,
    },
    {
      title: 'Đặt vé xem phim cuối tuần',
      listId: personalId,
      priority: 'none',
      completed: true,
      completedAt: daysAgo(1, 21),
      dueDate: daysAgo(1, 18),
      tags: ['fun'],
      sortOrder: 29,
    },
    {
      title: 'Follow up báo giá phần mềm',
      listId: inboxId,
      priority: 'urgent',
      dueDate: daysAgo(2, 15),
      tags: ['sales', 'overdue'],
      sortOrder: 30,
    },
    {
      title: 'Viết test cho module calendar',
      listId: workId,
      columnId: cols.backlog,
      priority: 'high',
      dueDate: daysFromNow(8, 10),
      tags: ['test', 'calendar'],
      sortOrder: 31,
    },
    {
      title: 'Cập nhật hồ sơ cá nhân',
      listId: personalId,
      priority: 'medium',
      dueDate: daysFromNow(9, 19),
      tags: ['profile'],
      sortOrder: 32,
    },
    {
      title: 'Tổng kết chi phí dự án',
      listId: workId,
      columnId: cols.done,
      priority: 'low',
      completed: true,
      completedAt: daysAgo(3, 17),
      dueDate: daysAgo(3, 15),
      tags: ['finance', 'project'],
      sortOrder: 33,
    },
    {
      title: 'Lên kịch bản demo cho nhà đầu tư',
      description: 'Chuẩn bị flow 5 phút, dữ liệu mẫu và câu trả lời cho phần Q&A.',
      listId: workId,
      columnId: cols.inProgress,
      priority: 'urgent',
      dueDate: daysFromNow(1, 10),
      tags: ['demo', 'investor'],
      subtasks: [
        { id: 'st-investor-demo-1', title: 'Chọn 3 màn hình chính', completed: true },
        { id: 'st-investor-demo-2', title: 'Viết script thuyết trình', completed: false },
        { id: 'st-investor-demo-3', title: 'Chuẩn bị backup video', completed: false },
      ],
      sortOrder: 34,
    },
    {
      title: 'Xử lý feedback từ buổi user interview',
      listId: workId,
      columnId: cols.review,
      priority: 'high',
      dueDate: daysFromNow(2, 16),
      tags: ['feedback', 'research'],
      sortOrder: 35,
    },
    {
      title: 'Đăng ký gói gym mới',
      listId: personalId,
      priority: 'medium',
      dueDate: daysFromNow(12, 18),
      tags: ['health'],
      sortOrder: 36,
    },
    {
      title: 'Nộp báo cáo thuế cá nhân',
      listId: personalId,
      priority: 'urgent',
      dueDate: daysAgo(1, 14),
      tags: ['tax', 'overdue'],
      sortOrder: 37,
    },
    {
      title: 'Kiểm tra cảnh báo uptime',
      listId: inboxId,
      priority: 'high',
      dueDate: daysFromNow(0, 22),
      tags: ['ops', 'alert'],
      sortOrder: 38,
    },
    {
      title: 'Tối ưu empty state cho dashboard',
      listId: workId,
      columnId: cols.backlog,
      priority: 'medium',
      dueDate: daysFromNow(5, 11),
      tags: ['ui', 'dashboard'],
      sortOrder: 39,
    },
    {
      title: 'Gửi lời cảm ơn mentor',
      listId: inboxId,
      priority: 'low',
      dueDate: daysFromNow(1, 19),
      tags: ['relationship'],
      sortOrder: 40,
    },
    {
      title: 'Cập nhật changelog bản demo',
      listId: workId,
      columnId: cols.done,
      priority: 'medium',
      completed: true,
      completedAt: daysAgo(0, 18),
      dueDate: daysAgo(0, 17),
      tags: ['release', 'docs'],
      sortOrder: 41,
    },
    {
      title: 'Soạn email onboarding cho team mới',
      listId: workId,
      columnId: cols.backlog,
      priority: 'medium',
      dueDate: daysFromNow(6, 9),
      tags: ['onboarding', 'email'],
      sortOrder: 42,
    },
    {
      title: 'Tổng vệ sinh nhà bếp',
      listId: personalId,
      priority: 'none',
      dueDate: daysFromNow(3, 8),
      tags: ['home'],
      sortOrder: 43,
    },
    {
      title: 'Đối soát giao dịch thẻ',
      listId: personalId,
      priority: 'high',
      dueDate: daysFromNow(0, 21),
      tags: ['finance'],
      sortOrder: 44,
    },
    {
      title: 'Review kế hoạch marketing tháng 9',
      listId: workId,
      columnId: cols.review,
      priority: 'high',
      dueDate: daysFromNow(7, 15),
      tags: ['marketing', 'planning'],
      sortOrder: 45,
    },
    {
      title: 'Đặt lịch bảo dưỡng xe',
      listId: personalId,
      priority: 'medium',
      dueDate: daysFromNow(14, 10),
      tags: ['maintenance'],
      sortOrder: 46,
    },
    {
      title: 'Rà soát quyền truy cập admin',
      listId: workId,
      columnId: cols.inProgress,
      priority: 'urgent',
      dueDate: daysFromNow(0, 13),
      tags: ['security', 'admin'],
      sortOrder: 47,
    },
    {
      title: 'Viết outline video hướng dẫn',
      listId: workId,
      columnId: cols.backlog,
      priority: 'low',
      dueDate: daysFromNow(11, 14),
      tags: ['video', 'docs'],
      sortOrder: 48,
    },
    {
      title: 'Mua thực phẩm cho tuần mới',
      listId: personalId,
      priority: 'medium',
      completed: true,
      completedAt: daysAgo(1, 10),
      dueDate: daysAgo(1, 9),
      tags: ['shopping'],
      sortOrder: 49,
    },
    {
      title: 'Chạy smoke test sau deploy',
      listId: workId,
      columnId: cols.done,
      priority: 'high',
      completed: true,
      completedAt: daysAgo(0, 20),
      dueDate: daysAgo(0, 19),
      tags: ['qa', 'deploy'],
      sortOrder: 50,
    },
    {
      title: 'Ghi chú ý tưởng tính năng AI',
      listId: inboxId,
      priority: 'low',
      dueDate: daysFromNow(15, 12),
      tags: ['idea', 'ai'],
      sortOrder: 51,
    },
    {
      title: 'Chuẩn bị checklist phỏng vấn ứng viên',
      listId: workId,
      columnId: cols.review,
      priority: 'medium',
      dueDate: daysFromNow(4, 15),
      tags: ['hiring'],
      sortOrder: 52,
    },
    {
      title: 'Thanh toán tiền điện',
      listId: personalId,
      priority: 'urgent',
      dueDate: daysAgo(3, 18),
      tags: ['bill', 'overdue'],
      sortOrder: 53,
    },
  ] as const

  for (const spec of expandedTaskSpecs) {
    if (existingTaskTitles.has(spec.title)) continue

    await prisma.todoTask.create({
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
        sortOrder: spec.sortOrder,
      },
    })
  }

  const existingHabitNames = new Set(
    (
      await prisma.habit.findMany({
        where: { userId },
        select: { name: true },
      })
    ).map((habit) => habit.name),
  )

  const expandedHabitSpecs = [
    { name: 'Viết nhật ký cuối ngày', completionCount: 6 },
    { name: 'Đi bộ 5000 bước', completionCount: 8 },
    { name: 'Học tiếng Anh 15 phút', completionCount: 5 },
    { name: 'Dọn bàn làm việc', completionCount: 9 },
    { name: 'Không dùng điện thoại trước khi ngủ', completionCount: 4 },
  ]

  for (const habit of expandedHabitSpecs) {
    if (existingHabitNames.has(habit.name)) continue

    await prisma.habit.create({
      data: {
        userId,
        name: habit.name,
        completions: toJsonString(habitDateOffsets(habit.completionCount)),
      },
    })
  }

  const existingCountdownTitles = new Set(
    (
      await prisma.countdownEvent.findMany({
        where: { userId },
        select: { title: true },
      })
    ).map((event) => event.title),
  )

  const expandedCountdownSpecs = [
    { title: 'Gia hạn domain/app hosting', targetDate: daysFromNow(30), color: '#ef4444' },
    { title: 'Sinh nhật mẹ', targetDate: daysFromNow(90), color: '#ec4899' },
    { title: 'Demo với nhà đầu tư', targetDate: daysFromNow(21), color: '#8b5cf6' },
    { title: 'Kết thúc sprint hiện tại', targetDate: daysFromNow(9), color: '#14b8a6' },
    { title: 'Ngày nghỉ gia đình', targetDate: daysFromNow(120), color: '#f97316' },
  ]

  for (const event of expandedCountdownSpecs) {
    if (existingCountdownTitles.has(event.title)) continue

    await prisma.countdownEvent.create({
      data: {
        userId,
        title: event.title,
        targetDate: event.targetDate,
        color: event.color,
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
