import type { AiProvider } from '../lib/ai-common'

const DEV_JWT_KEY = 'dev-jwt-key-change-me-in-production-32b'

function parseAiProvider(value: string | undefined): AiProvider {
  const normalized = (value ?? 'gemini').trim().toLowerCase()
  if (
    normalized === 'openai' ||
    normalized === 'openai_compatible' ||
    normalized === 'openai-compatible'
  ) {
    return 'openai'
  }
  return 'gemini'
}

function warnIfMissing(name: string, value: string | undefined, fallback?: string): string {
  if (!value || value.trim() === '') {
    if (fallback !== undefined) {
      console.warn(`[config] Missing ${name}; using development default`)
      return fallback
    }
    console.error(`[config] Required ${name} is missing`)
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
    return ''
  }
  return value
}

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  jwt: {
    key: warnIfMissing('JWT_KEY', process.env.JWT_KEY, DEV_JWT_KEY),
    issuer: process.env.JWT_ISSUER || 'Taskflow',
    audience: process.env.JWT_AUDIENCE || 'TaskflowClient',
    expiresHours: 12,
    refreshExpiresDays: 7,
  },
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres:taskflow@localhost:5434/taskflow_db?sslmode=disable',
  /** @deprecated use config.ai.geminiApiKey */
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  ai: {
    provider: parseAiProvider(process.env.AI_PROVIDER),
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiBaseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}
