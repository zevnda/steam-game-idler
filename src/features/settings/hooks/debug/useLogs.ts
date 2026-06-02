import type { LogEntry } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useEffect, useState } from 'react'
import { logEvent } from '@/shared/services/logService'

export function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const fullLogPath = await invoke<string>('get_cache_dir_path')
        const logFilePath = `${fullLogPath}\\log.txt`
        let contents = ''
        try {
          contents = await readTextFile(logFilePath)
        } catch {
          await logEvent('No log file found so one was created')
          try {
            contents = await readTextFile(logFilePath)
          } catch {
            setLogs([])
            return
          }
        }
        const entries = contents
          .split('\n')
          .filter(l => l.trim())
          .map(line => {
            const match = line.match(/^\[(.+?)\]\s+(.+)$/)
            return match
              ? { timestamp: match[1], message: match[2] }
              : { timestamp: '', message: line }
          })
          .filter(e => e.message)
        setLogs(entries.reverse())
      } catch (error) {
        console.error('Error fetching logs:', error)
        setLogs([])
      }
    }
    fetchLogs()
  }, [])

  return { logs }
}
