const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 }

type Level = keyof typeof LEVELS

function activeLevel(): Level {
  const level = process.env.LOG_LEVEL ?? 'info'
  return (level in LEVELS ? level : 'info') as Level
}

function log(level: Level, event: string, details: Record<string, unknown> = {}) {
  if (LEVELS[level] < LEVELS[activeLevel()]) return
  console.log(JSON.stringify({ level, event, ...details, ts: new Date().toISOString() }))
}

export const logger = {
  debug: (event: string, details?: Record<string, unknown>) => log('debug', event, details),
  info:  (event: string, details?: Record<string, unknown>) => log('info',  event, details),
  warn:  (event: string, details?: Record<string, unknown>) => log('warn',  event, details),
  error: (event: string, details?: Record<string, unknown>) => log('error', event, details),
}
