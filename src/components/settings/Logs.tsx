import type { LogEntry } from '@/types'
import type { ReactElement } from 'react'

import { Button, cn } from '@heroui/react'
import { GeistMono } from 'geist/font/mono'
import { useTranslation } from 'react-i18next'
import { TbEraser, TbFolders } from 'react-icons/tb'

import { handleClearLogs, handleOpenLogFile, useLogs } from '@/hooks/settings/useLogs'

export default function Logs(): ReactElement {
  const { t } = useTranslation()
  const { logs }: { logs: LogEntry[] } = useLogs()

  return (
    <div className='relative flex flex-col gap-4'>
      <div className='flex flex-col gap-4 border border-border rounded-lg p-3 bg-titlebar'>
        <div className='flex gap-2 w-full'>
          <Button
            size='sm'
            className='font-semibold rounded-lg bg-dynamic text-button-text'
            onPress={handleOpenLogFile}
            startContent={<TbFolders size={20} />}
          >
            {t('achievementManager.file')}
          </Button>
          <Button
            size='sm'
            color='danger'
            className='font-semibold rounded-lg'
            onPress={() => handleClearLogs()}
            startContent={<TbEraser size={20} />}
          >
            {t('settings.logs.clearLogs')}
          </Button>
        </div>

        <div
          className={cn('bg-container border border-border text-xs rounded-tl-lg rounded-tr-lg', GeistMono.className)}
        >
          <table className='w-full border-collapse'>
            <thead className='sticky top-0'>
              <tr className='border-b border-border bg-tablehead'>
                <th className='text-left p-1.5 w-[160px] rounded-tl-lg'>{t('settings.logs.time')}</th>
                <th className='text-left p-1.5 rounded-tr-lg'>{t('settings.logs.message')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                <>
                  {logs.map((log, index) => (
                    <tr key={log.timestamp} className={index % 2 === 0 ? 'bg-tablerowalt' : 'bg-tablerow'}>
                      <td className='p-1.5 text-altwhite uppercase align-top'>{log.timestamp}</td>
                      <td
                        className={`max-w-[100px] overflow-hidden break-words p-1.5 ${log.message?.includes('Error') && 'text-red-400'}`}
                      >
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </>
              ) : (
                <tr className='bg-container'>
                  <td className='p-1.5 text-altwhite'>-</td>
                  <td className='p-1.5'>No logs created yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
