import express from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import { authRouter } from './routes/auth'
import { tasksRouter } from './routes/tasks'
import { listsRouter } from './routes/lists'
import { habitsRouter } from './routes/habits'
import { countdownRouter } from './routes/countdown'
import { pomodoroSessionsRouter, pomodoroStateRouter } from './routes/pomodoro'
import { settingsRouter } from './routes/settings'
import { profileRouter } from './routes/profile'
import { aiRouter } from './routes/ai'
import { healthRouter } from './routes/health'

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
