import type { LogEntry } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { useTranslation } from 'react-i18next'
import { TbChevronRight, TbEraser, TbFolders } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import { GeistMono } from 'geist/font/mono'
import { ClearData } from '@/features/settings/components/debug/ClearData'
import { ExportSettings } from '@/features/settings/components/debug/ExportSettings'
import { OpenSettings } from '@/features/settings/components/debug/OpenSettings'
import { ResetSettings } from '@/features/settings/components/debug/ResetSettings'
import { useLogs } from '@/features/settings/hooks/debug/useLogs'
import { useSettings } from '@/features/settings/hooks/useSettings'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'

async function handleClearLogs() {
  try {
    await invoke('clear_log_file')
    toast.success('Logs cleared')
    await logEvent('[Settings - Logs] Logs cleared')
  } catch {
    toast.danger('Error clearing logs')
  }
}

async function handleOpenLogFile() {
  try {
    await invoke('open_file_explorer', { path: 'log.txt' })
  } catch {
    toast.danger('Error opening log file')
  }
}

export function Logs() {
  const { t } = useTranslation()
  const { logs }: { logs: LogEntry[] } = useLogs()
  const { setRefreshKey } = useSettings()

  return (
    <div className='relative flex flex-col gap-4 mt-9 pr-10'>
      <div className='flex flex-col gap-0 select-none'>
        <p className='flex items-center text-xs text-altwhite font-bold'>
          {t('settings.title')}
          <span>
            <TbChevronRight size={12} />
          </span>
        </p>
        <p className='text-3xl font-black'>{t('settings.debug.title')}</p>
      </div>
      <div className='flex flex-col gap-4 mt-4'>
        <div className='flex items-center justify-between'>
          <div className='grid grid-cols-3 gap-2'>
            <Button
              size='sm'
              className='bg-btn-secondary text-btn-text font-bold'
              radius='full'
              onPress={handleOpenLogFile}
              startContent={<TbFolders size={20} />}
            >
              {t('settings.debug.viewLogFile')}
            </Button>
            <OpenSettings />
            <ExportSettings />
            <Button
              size='sm'
              variant='light'
              radius='full'
              color='danger'
              onPress={handleClearLogs}
              startContent={<TbEraser size={20} />}
            >
              {t('settings.debug.clearLogs')}
            </Button>
            <ResetSettings setRefreshKey={setRefreshKey} />
            <ClearData />
          </div>
        </div>
        <div className='border border-border rounded-lg overflow-hidden bg-base/20'>
          <div className='h-[calc(100vh-290px)] overflow-y-auto'>
            {logs.length > 0 ? (
              <div className='divide-y divide-border/30'>
                {logs.map((log, index) => (
                  <div
                    key={log.timestamp}
                    className='flex items-start gap-3 px-4 py-2 hover:bg-item-hover/30 transition-colors group duration-150'
                  >
                    <div className='flex items-center gap-2 min-w-0 shrink-0'>
                      <span className='text-xs text-altwhite/60 font-mono tabular-nums'>
                        {String(index + 1).padStart(3, '0')}
                      </span>
                      <div
                        className={cn(
                          'w-1 h-1 rounded-full shrink-0',
                          log.message?.includes('Error') ? 'bg-red-400' : 'bg-green-400',
                        )}
                      />
                    </div>
                    <div className='flex flex-col gap-0.5 min-w-0 flex-1'>
                      {log.timestamp && (
                        <span className='text-[10px] text-altwhite/50 font-mono'>
                          {log.timestamp}
                        </span>
                      )}
                      <p className={`${GeistMono.className} text-xs text-content/85 break-all`}>
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center h-full'>
                <p className='text-altwhite text-sm'>{t('settings.debug.noLogs')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
