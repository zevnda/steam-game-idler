import { Fragment, useContext, useEffect } from 'react';
import Image from 'next/image';

import { invoke } from '@tauri-apps/api/tauri';

import { AppContext } from '@/src/components/layout/AppContext';
import { handleIdle, viewAchievments } from '@/src/utils/gameslist/gameCardHandler';

import { IoPlay } from 'react-icons/io5';
import { FaAward } from 'react-icons/fa';

export default function GameCard({ item, sortedGamesList, visibleGames }) {
    const { setAppId, setAppName, showAchievements, setShowAchievements, currentIdleList, setCurrentIdleList } = useContext(AppContext);

    useEffect(() => {
        const runOnce = async () => {
            const notRunningIds = await invoke('check_process_by_game_id', { ids: currentIdleList });
            const updatedList = currentIdleList.filter((id) => !notRunningIds.includes(id));
            setCurrentIdleList(updatedList);
        };

        runOnce();
    }, []);

    useEffect(() => {
        const intervalId = setInterval(async () => {
            const notRunningIds = await invoke('check_process_by_game_id', { ids: currentIdleList });
            const updatedList = currentIdleList.filter((id) => !notRunningIds.includes(id));
            setCurrentIdleList(updatedList);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [currentIdleList]);

    const getBorderClass = (appid) => {
        return currentIdleList.includes(appid.toString()) ? 'border-4 pulse-border' : '';
    };

    return (
        <Fragment>
            <div className={`relative group select-none ${sortedGamesList.slice(0, visibleGames).length >= 21 ? 'w-[221px]' : 'w-[222px]'}`}>
                <div className={`aspect-[460/215] rounded-lg overflow-hidden transition-transform duration-200 ease-in-out transform group-hover:scale-105 ${getBorderClass(item.appid)}`}>
                    <Image
                        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
                        width={460}
                        height={215}
                        alt={`${item.name} image`}
                        priority={true}
                    />
                    <div className='absolute flex items-center justify-evenly inset-0 bg-black bg-opacity-0 dark:bg-opacity-20 group-hover:bg-opacity-40 dark:group-hover:bg-opacity-50 transition-opacity duration-200'>
                        <div className='absolute flex justify-center w-full bottom-0 left-0 px-2 pb-0.5 opacity-0 group-hover:opacity-100 duration-200'>
                            <p className='text-sm text-offwhite bg-black bg-opacity-50 rounded-sm px-1 select-none truncate'>
                                {item.name}
                            </p>
                        </div>

                        <div className='flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 hover:scale-105 duration-200' onClick={() => handleIdle(item, setCurrentIdleList)}>
                            <div className='p-2 bg-black text-offwhite bg-opacity-50 hover:bg-black hover:bg-opacity-70 cursor-pointer rounded duration-200'>
                                <IoPlay className='text-offwhite opacity-0 group-hover:opacity-100 duration-200' fontSize={36} />
                            </div>
                        </div>

                        <div className='flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 hover:scale-105 duration-200' onClick={() => viewAchievments(item, setAppId, setAppName, setShowAchievements, showAchievements)}>
                            <div className='p-2 bg-black text-offwhite bg-opacity-50 hover:bg-black hover:bg-opacity-70 cursor-pointer rounded duration-200'>
                                <FaAward className='text-offwhite opacity-0 group-hover:opacity-100 duration-200' fontSize={36} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Fragment>
    );
}