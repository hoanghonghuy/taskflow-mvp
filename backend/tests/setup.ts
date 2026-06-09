import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'

const testDbPath = path.join(__dirname, '..', 'data', 'test.db')

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = `file:${testDbPath}`
process.env.JWT_KEY = 'test-jwt-key-at-least-32-characters-long'
process.env.GEMINI_API_KEY = ''

const dataDir = path.dirname(testDbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

if (!fs.existsSync(testDbPath)) {
  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'pipe',
  })
}

afterAll(async () => {
  const { prisma } = await import('../src/lib/prisma')
  await prisma.$disconnect()
})
