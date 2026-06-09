import { createApp } from './app'
import { config } from './config'

const app = createApp()

app.listen(config.port, () => {
  console.log(`Taskflow backend listening on port ${config.port}`)
})
