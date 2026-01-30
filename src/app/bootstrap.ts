import { initI18n, initRuntimeConfig } from '@/shared/config'

export async function bootstrap() {
  await initRuntimeConfig()
  initI18n()
}
