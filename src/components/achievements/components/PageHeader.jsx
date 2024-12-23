import React, { useContext } from 'react';
import { Button, Tooltip } from '@nextui-org/react';
import { IoMdArrowBack } from 'react-icons/io';
import usePageHeader from '../hooks/usePageHeader';
import { AppContext } from '../../layout/components/AppContext';
import ExtLink from '../../ui/components/ExtLink';
import { SiSteamdb } from 'react-icons/si';

export default function PageHeader() {
    const { appId, appName } = useContext(AppContext);
    const { handleClick } = usePageHeader();

    return (
        <React.Fragment>
            <div className='flex justify-between items-center mb-4'>
                <div className='flex gap-3'>
                    <Button
                        size='sm'
                        color='primary'
                        isIconOnly
                        className='w-fit rounded-full duration-50'
                        startContent={<IoMdArrowBack fontSize={18} />}
                        onPress={handleClick}
                    />
                    <div className='flex items-center gap-2 w-full'>
                        <p className='text-lg font-semibold m-0 p-0'>
                            {appName}
                        </p>
                        <Tooltip content='View achievement details on SteamDB' placement='right' closeDelay={0} size='sm'>
                            <div>
                                <ExtLink href={`https://steamdb.info/app/${appId}/stats/`}>
                                    <SiSteamdb fontSize={14} className='text-sgi' />
                                </ExtLink>
                            </div>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}