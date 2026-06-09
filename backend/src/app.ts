import express from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import { authRouter } from './modules/auth/auth.routes'
import { tasksRouter } from './modules/tasks/tasks.routes'
import { listsRouter } from './modules/lists/lists.routes'
import { habitsRouter } from './modules/habits/habits.routes'
import { countdownRouter } from './modules/countdown/countdown.routes'
import {
  pomodoroSessionsRouter,
  pomodoroStateRouter,
} from './modules/pomodoro/pomodoro.routes'
import { settingsRouter } from './modules/settings/settings.routes'
import { profileRouter } from './modules/profile/profile.routes'
import { aiRouter } from './modules/ai/ai.routes'
import { healthRouter } from './modules/health/health.routes'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  )
  app.use(express.json())

  app.use('/health', healthRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/tasks', tasksRouter)
  app.use('/api/lists', listsRouter)
  app.use('/api/habits', habitsRouter)
  app.use('/api/countdown', countdownRouter)
  app.use('/api/pomodoro/sessions', pomodoroSessionsRouter)
  app.use('/api/pomodoro/state', pomodoroStateRouter)
  app.use('/api/settings', settingsRouter)
  app.use('/api/profile', profileRouter)
  app.use('/api/ai', aiRouter)

  app.use(errorHandler)

  return app
}
