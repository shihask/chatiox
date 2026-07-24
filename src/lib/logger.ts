import { config } from '@/lib/config'

export const logger = {
  debug: (...args: unknown[]) => {
    if (config.isDevelopment) console.debug('[debug]', ...args)
  },
  info: (...args: unknown[]) => {
    console.info('[info]', ...args)
  },
  warn: (...args: unknown[]) => {
    console.warn('[warn]', ...args)
  },
  error: (...args: unknown[]) => {
    console.error('[error]', ...args)
  },
}
