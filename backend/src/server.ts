import { createApp } from './app'
import { config } from './config'
import { seedAdminUser } from './seedAdmin'
import { seedDemoUser } from './seedDemoUser'

const app = createApp()

async function start(): Promise<void> {
  try {
    await seedAdminUser()
    await seedDemoUser()
  } catch (error) {
    console.error('[seed] Failed to seed bootstrap users', error)
  }

  app.listen(config.port, () => {
    console.log(`Taskflow backend listening on port ${config.port}`)
  })
}

void start()
