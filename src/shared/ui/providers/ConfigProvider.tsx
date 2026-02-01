import { createContext, useContext, useState, useEffect } from 'react'
import type { RuntimeConfig } from '../../config'
import { initRuntimeConfig, getRuntimeConfig } from '../../config'

const ConfigContext = createContext<RuntimeConfig | null>(null)

export function ConfigProvider({ children }: React.PropsWithChildren) {
  const [config, setConfig] = useState<RuntimeConfig | null>(null)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    initRuntimeConfig()
      .then(() => {
        setConfig(getRuntimeConfig())
      })
      .catch(err => {
        console.error('Failed to initialize runtime config:', err)
        setError(err)
      })
  }, [])

  // Throw error if config failed to load
  if (error) {
    throw error
  }

  // Don't render children until config is loaded
  if (!config) {
    return null
  }

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRuntimeConfig(): RuntimeConfig {
  const config = useContext(ConfigContext)
  if (!config) {
    throw new Error('useRuntimeConfig must be used within ConfigProvider')
  }
  return config
}
