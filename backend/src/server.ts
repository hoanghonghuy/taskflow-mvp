import { createApp } from './app'
import { config } from './config'
import { seedAdminUser } from './seedAdmin'

const app = createApp()

async function start(): Promise<void> {
  try {
    await seedAdminUser()
  } catch (error) {
    console.error('[seed] Failed to seed admin user', error)
  }

  app.listen(config.port, () => {
    console.log(`Taskflow backend listening on port ${config.port}`)
  })
}

void start()
