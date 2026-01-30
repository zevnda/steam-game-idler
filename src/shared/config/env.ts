import { z } from 'zod'

const validationSchema = z.object({
  MODE: z.enum(['production', 'development', 'test']),
  DEV: z.boolean(),
  PROD: z.boolean(),
})

const validatedConfig = validationSchema.parse(import.meta.env)

export interface AppConfig {
  MODE: 'production' | 'development' | 'test'
  isProd: boolean
  isDev: boolean
  isTest: boolean
}

const getConfig = (): AppConfig => {
  return {
    MODE: validatedConfig.MODE,
    isProd: validatedConfig.PROD || validatedConfig.MODE === 'production',
    isDev: validatedConfig.DEV || validatedConfig.MODE === 'development',
    isTest: validatedConfig.MODE === 'test',
  }
}

export const config = getConfig()
