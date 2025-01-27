import { Fragment, useContext } from 'react';

import { Button } from '@heroui/react';

import { AppContext } from '@/src/components/layout/AppContext';
import ExtLink from '@/src/components/ui/ExtLink';

export default function Private({ setRefreshKey }) {
    const { userSummary } = useContext(AppContext);

    const handleRefresh = () => {
        setRefreshKey(prevKey => prevKey + 1);
    };

    return (
        <Fragment>
            <div className='flex justify-center items-center w-calc min-h-calc max-h-calc'>
                <div className='flex justify-center items-center flex-col border border-border min-w-[400px] max-w-[400px] rounded-lg shadow-lg dark:shadow-none'>
                    <div className='flex items-center flex-col gap-2 p-6'>
                        <p className='text-4xl'>
                            Uh-oh!
                        </p>
                    </div>
                    <div className='flex justify-center items-center flex-col pb-6'>
                        <div className='flex justify-center items-center flex-col'>
                            <p className='text-center text-sm px-3'>Unable to retrieve games list. This is usually because:</p>
                            <ul className='text-xs list-disc mt-4'>
                                <li>
                                    Your profile is set to private
                                </li>
                                <li>
                                    Your game details are set to private
                                </li>
                                <li>
                                    You have no games in your library
                                </li>
                                <li>
                                    You are using an invalid Steam web API key
                                </li>
                            </ul>
                        </div>
                        <ExtLink href={`https://steamcommunity.com/profiles/${userSummary.steamId}/edit/settings`} className={'text-xs text-blue-400 mt-4'}>
                            Change account privacy
                        </ExtLink>
                        <Button
                            size='sm'
                            color='primary'
                            className='font-semibold rounded mt-5'
                            onPress={handleRefresh}
                        >
                            Try again
                        </Button>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}