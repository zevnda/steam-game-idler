import { Fragment, useContext } from 'react';
import { Button, Tooltip } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import usePageHeader from '@/src/hooks/achievements/usePageHeader';
import ExtLink from '@/src/components/ui/ExtLink';

import { SiSteam, SiSteamdb } from 'react-icons/si';
import { IoMdArrowBack } from 'react-icons/io';

export default function PageHeader() {
    const { appId, appName } = useContext(AppContext);
    const { handleClick } = usePageHeader();

    return (
        <Fragment>
            <div className='flex justify-between items-center mb-4'>
                <div className='flex gap-3'>
                    <Button
                        isIconOnly
                        size='sm'
                        color='default'
                        className='rounded-full'
                        startContent={<IoMdArrowBack fontSize={18} />}
                        onPress={handleClick}
                    />
                    <div className='flex items-center gap-2 w-full'>
                        <p className='text-lg font-semibold m-0 p-0'>
                            {appName}
                        </p>
                        <Tooltip content='View achievement details on Steam' placement='top' closeDelay={0} size='sm'>
                            <div>
                                <ExtLink href={`https://steamcommunity.com/stats/${appId}/achievements/`}>
                                    <div className='bg-default hover:brightness-90 rounded-full p-1.5 cursor-pointer duration-150'>
                                        <SiSteam fontSize={14} />
                                    </div>
                                </ExtLink>
                            </div>
                        </Tooltip>
                        <Tooltip content='View achievement details on SteamDB' placement='top' closeDelay={0} size='sm'>
                            <div>
                                <ExtLink href={`https://steamdb.info/app/${appId}/stats/`}>
                                    <div className='bg-default hover:brightness-90 rounded-full p-1.5 cursor-pointer duration-150'>
                                        <SiSteamdb fontSize={14} />
                                    </div>
                                </ExtLink>
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}