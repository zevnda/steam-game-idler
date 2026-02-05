import type { LogEntry } from '@/shared/types'
import type { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { TbChevronRight, TbEraser, TbFolders } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import { GeistMono } from 'geist/font/mono'
import ClearData from '@/features/settings/debug/ClearData'
import ExportSettings from '@/features/settings/debug/ExportSettings'
import {
  handleClearLogs,
  handleOpenLogFile,
  useLogs,
} from '@/features/settings/debug/hooks/useLogs'
import OpenSettings from '@/features/settings/debug/OpenSettings'
import ResetSettings from '@/features/settings/debug/ResetSettings'
import useSettings from '@/features/settings/hooks/useSettings'

export default function Logs(): ReactElement {
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
              onPress={() => handleClearLogs()}
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

                    <div className='min-w-0 flex-1'>
                      <div className='flex items-baseline gap-3'>
                        <span
                          className={cn(
                            'text-xs text-altwhite font-mono shrink-0',
                            GeistMono.className,
                          )}
                        >
                          [{log.timestamp}]
                        </span>
                        <span
                          className={cn(
                            'text-xs font-mono leading-relaxed break-all',
                            log.message?.includes('Error') ? 'text-red-300' : 'text-content',
                            GeistMono.className,
                          )}
                        >
                          {log.message}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex items-center justify-center py-16'>
                <div className='text-center'>
                  <div className='text-2xl text-altwhite/30 mb-2'>◯</div>
                  <p className='text-sm text-altwhite/60 font-mono'>No logs found</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
