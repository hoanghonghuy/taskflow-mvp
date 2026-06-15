import { createApp } from './app'
import { config } from './config'
import { seedAdminUser } from './seedAdmin'
import { seedDemoUser } from './seedDemoUser'

const SEED_TIMEOUT_MS = 15_000

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

const app = createApp()

async function start(): Promise<void> {
  // Seed là best-effort: nếu DB chậm / pool chết thì vẫn phải listen
  // để container có thể vào shell debug hoặc health check pass.
  try {
    await withTimeout(seedAdminUser(), SEED_TIMEOUT_MS, 'seedAdminUser')
    await withTimeout(seedDemoUser(), SEED_TIMEOUT_MS, 'seedDemoUser')
  } catch (error) {
    console.error('[seed] Bootstrap seed failed; continuing to listen', error)
  }

  app.listen(config.port, () => {
    console.log(`Taskflow backend listening on port ${config.port}`)
  })
}

void start()
