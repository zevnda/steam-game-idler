import type { LogEntry } from '@/types'

import { invoke } from '@tauri-apps/api/core'
import { appDataDir } from '@tauri-apps/api/path'
import { readTextFile } from '@tauri-apps/plugin-fs'

import { useEffect, useState } from 'react'

import { logEvent } from '@/utils/tasks'
import { showDangerToast, showSuccessToast, t } from '@/utils/toasts'

interface LogsHook {
  logs: LogEntry[]
}

export const useLogs = (): LogsHook => {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    const fetchLogs = async (): Promise<void> => {
      try {
        const fullLogPath = await appDataDir()
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
        showDangerToast(t('common.error'))
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

// Open the log file in file explorer
export const handleOpenLogFile = async (): Promise<void> => {
  try {
    await invoke('open_file_explorer', { path: 'log.txt' })
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (handleOpenLogFile):', error)
    logEvent(`[Error] in (handleOpenLogFile): ${error}`)
  }
}

// Clear the log file
export const handleClearLogs = async (log = true): Promise<void> => {
  try {
    await invoke('clear_log_file')
    // Only show toast if log was manually cleared
    if (log) {
      showSuccessToast(t('toast.clearLogs.success'))
      logEvent('[Settings - Logs] Logs cleared successfully')
    }
  } catch (error) {
    showDangerToast(t('common.error'))
    console.error('Error in (handleClearLogs):', error)
    logEvent(`[Error] in (handleClearLogs): ${error}`)
  }
}
