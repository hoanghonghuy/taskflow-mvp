const DEV_JWT_KEY = 'dev-jwt-key-change-me-in-production-32b'

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
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
}
