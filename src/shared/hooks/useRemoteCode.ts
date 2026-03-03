import { useEffect } from 'react'
import { useRemoteStore } from '@/shared/stores'

export function useRemoteCode() {
  const { setRemoteCode } = useRemoteStore()

  useEffect(() => {
    const remoteCode = Math.floor(100000 + Math.random() * 900000).toString()
    setRemoteCode(remoteCode)
  }, [setRemoteCode])
}
