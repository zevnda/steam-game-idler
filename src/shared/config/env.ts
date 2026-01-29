import { z } from 'zod'

const validationSchema = z.object({
  NODE_ENV: z.enum(['production', 'development', 'test']),
})

const validatedConfig = validationSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
})

interface AppConfig {
  NODE_ENV: 'production' | 'development' | 'test'
  isProd: boolean
  isDev: boolean
  isTest: boolean
}

const getConfig = (): AppConfig => {
  return {
    NODE_ENV: validatedConfig.NODE_ENV,
    isProd: validatedConfig.NODE_ENV === 'production',
    isDev: validatedConfig.NODE_ENV === 'development',
    isTest: validatedConfig.NODE_ENV === 'test',
  }
}

export const config = getConfig()
