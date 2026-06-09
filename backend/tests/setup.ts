import { execSync } from 'child_process'
import path from 'path'

const defaultTestDatabaseUrl =
  'postgresql://postgres:taskflow@localhost:5434/taskflow_db?sslmode=disable'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || defaultTestDatabaseUrl
process.env.JWT_KEY = 'test-jwt-key-at-least-32-characters-long'
process.env.GEMINI_API_KEY = ''

execSync('npx prisma migrate deploy', {
  cwd: path.join(__dirname, '..'),
  env: process.env,
  stdio: 'pipe',
})

afterAll(async () => {
  const { prisma } = await import('../src/lib/prisma')
  await prisma.$disconnect()
})
