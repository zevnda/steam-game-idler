import { useEffect, useState } from 'react'
import { getAppVersion } from '@/shared/utils'

export function useSettings() {
  const [version, setVersion] = useState('0.0.0')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    getAppVersion().then(v => setVersion(v || '0.0.0'))
  }, [])

  return { version, refreshKey, setRefreshKey }
}
