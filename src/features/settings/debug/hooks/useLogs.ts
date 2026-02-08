import type { LogEntry } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useEffect, useState } from 'react'
import i18next from 'i18next'
import { showDangerToast } from '@/shared/ui'
import { logEvent } from '@/shared/utils'

export const useLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const fullLogPath = await invoke<string>('get_cache_dir_path')
        const logFilePath = `${fullLogPath}\\log.txt`

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
        showDangerToast(i18next.t('common.error'))
        console.error('Error in (fetchLogs):', error)
        logEvent(`[Error] in (fetchLogs): ${error}`)
      }
    }
    fetchLogs()

    const intervalId = setInterval(fetchLogs, 1000)

    return () => clearInterval(intervalId)
  }, [])

  return { logs }
}
