import React from 'react';
import useLogs from '../hooks/useLogs';
import { handleOpenLogFile, handleClearLogs } from '../utils/logsHandler';
import { Button } from '@nextui-org/react';

export default function Logs() {
    const { logs, logPath } = useLogs();

    return (
        <React.Fragment>
            <div className='p-2'>
                <div className='flex gap-2 w-full mb-4'>
                    <Button
                        size='sm'
                        color='primary'
                        className='font-semibold rounded'
                        onClick={() => handleOpenLogFile(logPath)}
                    >
                        Open in File Explorer
                    </Button>
                    <Button
                        size='sm'
                        color='danger'
                        className='font-semibold rounded'
                        onClick={handleClearLogs}
                    >
                        Clear logs
                    </Button>

                </div>
                <div className='bg-container border border-border font-mono text-xs rounded min-h-[200px] max-h-[calc(100vh-285px)] overflow-y-auto'>
                    <table className='w-full border-collapse'>
                        <thead className='sticky top-0 z-10'>
                            <tr className='border-b border-border bg-[#dedede] dark:bg-[#131313]'>
                                <th className='text-left p-1.5 w-[200px]'>Time</th>
                                <th className='text-left p-1.5'>Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? (
                                <React.Fragment>
                                    {logs.map((log, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-container' : 'bg-[#f1f1f1] dark:bg-[#1a1a1a]'}>
                                            <td className='p-1.5 text-sgi uppercase'>{log.timestamp}</td>
                                            <td className={`p-1.5 ${log.message?.includes('Error') && 'text-red-400'}`}>
                                                {log.message}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ) : (
                                <tr className='bg-container'>
                                    <td className='p-1.5 text-sgi uppercase'>-</td>
                                    <td className='p-1.5'>No logs created yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </React.Fragment>
    );
}