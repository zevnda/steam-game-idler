import { Fragment, useContext, useState, useEffect } from 'react';
import { Alert, Button, Tooltip } from '@heroui/react';

import { AppContext } from '@/components/contexts/AppContext';
import usePageHeader from '@/hooks/achievements/usePageHeader';
import ExtLink from '@/components/ui/ExtLink';

import { SiSteam, SiSteamdb } from 'react-icons/si';
import { TbArrowBack } from 'react-icons/tb';

export default function PageHeader() {
    const { appId, appName } = useContext(AppContext);
    const { handleClick } = usePageHeader();

    const [protectedAchievements, setProtectedAchievements] = useState(false);

    useEffect(() => {
        const protectedAchievements = async () => {
            const response = await fetch('/server-side-games.json');
            const data = await response.json();
            if (data.some(game => game.appid === appId.toString())) {
                setProtectedAchievements(true);
            }
        };
        protectedAchievements();
    }, []);

    return (
        <Fragment>
            <div className='relative flex justify-between items-center mb-4'>
                {protectedAchievements && (
                    <div className='absolute top-0 right-0'>
                        <Alert
                            color='warning'
                            title='This game has server-side achievements that can&apos;t be modified from here.'
                            classNames={{
                                base: ['h-10 py-1 flex justify-center items-center gap-0 rounded-lg'],
                                title: ['text-xs'],
                                iconWrapper: ['h-6 w-6'],
                                alertIcon: ['h-5 w-5']
                            }}
                        />
                    </div>
                )}
                <div className='flex gap-3'>
                    <Button
                        isIconOnly
                        size='sm'
                        className='rounded-full bg-border'
                        startContent={<TbArrowBack fontSize={18} className='text-content' />}
                        onPress={handleClick}
                    />
                    <div className='flex items-center gap-1 w-full'>
                        <p className='text-lg font-semibold m-0 p-0'>
                            {appName}
                        </p>
                        <Tooltip content='View on Steam' placement='top' closeDelay={0} size='sm'>
                            <div>
                                <ExtLink href={`https://steamcommunity.com/stats/${appId}/achievements/`}>
                                    <div className='hover:bg-border rounded-full p-1.5 cursor-pointer duration-200'>
                                        <SiSteam fontSize={14} />
                                    </div>
                                </ExtLink>
                            </div>
                        </Tooltip>
                        <Tooltip content='View on SteamDB' placement='top' closeDelay={0} size='sm'>
                            <div>
                                <ExtLink href={`https://steamdb.info/app/${appId}/stats/`}>
                                    <div className='hover:bg-border rounded-full p-1.5 cursor-pointer duration-200'>
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