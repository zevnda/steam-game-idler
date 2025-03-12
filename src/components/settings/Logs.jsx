import { Fragment } from 'react';

import { Button } from '@heroui/react';

import { handleOpenLogFile, handleClearLogs } from '@/utils/settings/logsHandler';
import useLogs from '@/hooks/settings/useLogs';

export default function Logs() {
    const { logs, logPath } = useLogs();

    return (
        <Fragment>
            <div className='p-2'>
                <div className='flex justify-between gap-2 w-full mb-4'>
                    <Button
                        size='sm'
                        className='font-semibold rounded-lg bg-dynamic text-content'
                        onPress={() => handleOpenLogFile(logPath)}
                    >
                        Open in File Explorer
                    </Button>
                    <Button
                        size='sm'
                        color='danger'
                        className='font-semibold rounded-lg'
                        onPress={handleClearLogs}
                    >
                        Clear Logs
                    </Button>
                </div>

                <div className='bg-container border border-border font-mono text-xs rounded min-h-[200px] max-h-[calc(100vh-285px)] overflow-y-auto'>
                    <table className='w-full border-collapse'>
                        <thead className='sticky top-0 z-10'>
                            <tr className='border-b border-border bg-tablehead'>
                                <th className='text-left p-1.5 w-[160px]'>Time</th>
                                <th className='text-left p-1.5'>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? (
                                <Fragment>
                                    {logs.map((log, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-tablerowalt' : 'bg-tablerow'}>
                                            <td className='p-1.5 text-altwhite uppercase'>{log.timestamp}</td>
                                            <td className={`p-1.5 ${log.message?.includes('Error') && 'text-red-400'}`}>
                                                {log.message}
                                            </td>
                                        </tr>
                                    ))}
                                </Fragment>
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
        </Fragment>
    );
}