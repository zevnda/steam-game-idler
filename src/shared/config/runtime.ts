import { isPortableInstall } from './isPortableInstall'

export interface RuntimeConfig {
  isPortable: boolean
}

let runtimeConfig: RuntimeConfig | null = null
let initPromise: Promise<RuntimeConfig> | null = null

async function init(): Promise<RuntimeConfig> {
  const isPortable = await isPortableInstall()

  return {
    isPortable,
  }
}

export async function initRuntimeConfig() {
  if (runtimeConfig || initPromise) {
    return
  }

  initPromise = init()
  runtimeConfig = await initPromise
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!runtimeConfig) {
    throw new Error('Runtime config is not initialized. Call initRuntimeConfig() first')
  }

  return runtimeConfig
}
