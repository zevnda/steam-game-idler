import { useEffect, useState } from 'react'
import { getAppVersion } from '@/shared/utils'

export function useSettings() {
  const [version, setVersion] = useState('0.0.0')
  const [refreshKey, setRefreshKey] = useState(0)

  // Get the app version
  useEffect(() => {
    const getAndSetVersion = async () => {
      const version = await getAppVersion()
      setVersion(version ? version : '0.0.0')
    }
    getAndSetVersion()
  }, [])

  return { version, refreshKey, setRefreshKey }
}
