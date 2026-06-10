process.env.E2E_MOCK_MODE = 'true'

const { spawnSync } = require('child_process')

const result = spawnSync('npx', ['playwright', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(result.status ?? 1)
