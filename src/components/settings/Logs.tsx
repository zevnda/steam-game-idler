import { Button } from '@heroui/react';
import { GeistMono } from 'geist/font/mono';
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import { useLogs, handleClearLogs, handleOpenLogFile } from '@/hooks/settings/useLogs';
import type { LogEntry } from '@/types/log';

export default function Logs(): JSX.Element {
    const { t } = useTranslation();
    const { logs }: { logs: LogEntry[] } = useLogs();

    return (
        <div className='p-2'>
            <div className='flex justify-between gap-2 w-full mb-4'>
                <Button
                    size='sm'
                    className='font-semibold rounded-lg bg-dynamic text-button'
                    onPress={() => handleOpenLogFile()}
                >
                    {t('settings.logs.openLogFile')}
                </Button>
                <Button
                    size='sm'
                    color='danger'
                    className='font-semibold rounded-lg'
                    onPress={() => handleClearLogs()}
                >
                    {t('settings.logs.clearLogs')}
                </Button>
            </div>

            <div className={`${GeistMono.className} bg-container border border-border text-xs rounded min-h-[200px] max-h-[calc(100vh-285px)] overflow-y-auto`}>
                <table className='w-full border-collapse'>
                    <thead className='sticky top-0 z-10'>
                        <tr className='border-b border-border bg-tablehead'>
                            <th className='text-left p-1.5 w-[160px]'>
                                {t('settings.logs.time')}
                            </th>
                            <th className='text-left p-1.5'>
                                {t('settings.logs.message')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? (
                            <>
                                {logs.map((log, index) => (
                                    <tr key={log.timestamp} className={index % 2 === 0 ? 'bg-tablerowalt' : 'bg-tablerow'}>
                                        <td className='p-1.5 text-altwhite uppercase'>{log.timestamp}</td>
                                        <td className={`p-1.5 ${log.message?.includes('Error') && 'text-red-400'}`}>
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
    );
}