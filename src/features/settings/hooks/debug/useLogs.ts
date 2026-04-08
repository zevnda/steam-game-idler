import type { LogEntry } from '@/shared/types'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useEffect, useState } from 'react'
import { hasTauriInvoke, invokeSafe, isMissingTauriInvokeError, logEvent } from '@/shared/utils'

export const useLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    if (!hasTauriInvoke()) {
      setLogs([])
      return
    }

    const fetchLogs = async () => {
      try {
        const fullLogPath = await invokeSafe<string>('get_cache_dir_path')
        if (!fullLogPath) {
          setLogs([])
          return
        }

        const separator = fullLogPath.includes('\\') ? '\\' : '/'
        const normalizedBasePath = fullLogPath.replace(/[\\/]+$/, '')
        const logFilePath = `${normalizedBasePath}${separator}log.txt`

        // Check if log file exists
        let logContents = ''
        try {
          logContents = await readTextFile(logFilePath)
        } catch (fileError) {
          // Create log file if not exists
          console.error('Error in (fetchLogs) - file had to be created:', fileError)
          await logEvent('No log file found so one was created')
          // Try to read again
          try {
            logContents = await readTextFile(logFilePath)
          } catch (retryError) {
            // Still failed, set empty logs
            console.error('Error in (fetchLogs) - unable to create file:', retryError)
            setLogs([])
            return
          }
        }

        // Process log contents
        const logEntries = logContents
          .split('\n')
          .filter(entry => entry.trim() !== '')
          .map(entry => {
            const [timestamp, message] = entry.split(' + ')
            return { timestamp, message }
          })
        setLogs(logEntries)
      } catch (error) {
        if (isMissingTauriInvokeError(error)) {
          setLogs([])
          return
        }

        setLogs([])
        console.error('Error in (fetchLogs):', error)
      }
    }
    fetchLogs()

    const intervalId = setInterval(fetchLogs, 1000)

    return () => clearInterval(intervalId)
  }, [])

  return { logs }
}
