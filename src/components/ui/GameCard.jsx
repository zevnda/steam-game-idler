import { Fragment, useContext, useState } from 'react';
import Image from 'next/image';

import { AppContext } from '@/src/components/layout/AppContext';
import { handleIdle, viewAchievments, viewGameSettings, viewStorePage } from '@/src/utils/gameslist/gameCardHandler';
import CardMenu from '@/src/components/gameslist/CardMenu';

import { IoPlay } from 'react-icons/io5';
import { FaAward } from 'react-icons/fa';
import { Button } from '@heroui/react';

export default function GameCard({ item, sortedGamesList, visibleGames, setSettingsModalOpen }) {
    const { setAppId, setAppName, showAchievements, setShowAchievements } = useContext(AppContext);
    const [isBlurred, setIsBlurred] = useState(false);

    const handleImageError = (event) => {
        event.target.src = '/fallback.jpg';
        setIsBlurred(true);
    };

    return (
        <Fragment>
            <div className={`relative group select-none ${sortedGamesList.slice(0, visibleGames).length >= 21 ? 'w-[221px]' : 'w-[222px]'}`}>
                <div className='aspect-[460/215] rounded-lg overflow-hidden transition-transform duration-200 ease-in-out transform group-hover:scale-105'>
                    <Image
                        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
                        width={460}
                        height={215}
                        alt={`${item.name} image`}
                        priority={true}
                        onError={handleImageError}
                        className={isBlurred ? 'blur-sm' : ''}
                    />
                    <div className='absolute flex items-center justify-evenly inset-0 bg-black bg-opacity-0 dark:bg-opacity-20 group-hover:bg-opacity-40 dark:group-hover:bg-opacity-50 transition-opacity duration-200'>
                        <div className='absolute flex justify-center w-full bottom-0 left-0 px-2 pb-0.5 opacity-0 group-hover:opacity-100 duration-200'>
                            <p className='text-sm text-offwhite bg-black bg-opacity-50 rounded-sm px-1 select-none truncate'>
                                {item.name}
                            </p>
                        </div>

                        <Button
                            isIconOnly
                            size='lg'
                            className='flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 hover:scale-105  active:scale-95 duration-200 rounded bg-opacity-50 bg-black'
                            startContent={
                                <div className='p-2 bg-black text-offwhite bg-opacity-10 hover:bg-black hover:bg-opacity-40 cursor-pointer rounded duration-200'>
                                    <IoPlay className='text-offwhite opacity-0 group-hover:opacity-100 duration-200' fontSize={36} />
                                </div>
                            }
                            onPress={() => handleIdle(item)}
                        />

                        <Button
                            isIconOnly
                            size='lg'
                            className='flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 hover:scale-105  active:scale-95 duration-200 rounded bg-opacity-50 bg-black'
                            startContent={
                                <div className='p-2 bg-black text-offwhite bg-opacity-10 hover:bg-black hover:bg-opacity-40 cursor-pointer rounded duration-200'>
                                    <FaAward className='text-offwhite opacity-0 group-hover:opacity-100 duration-200' fontSize={36} />
                                </div>
                            }
                            onPress={() => viewAchievments(item, setAppId, setAppName, setShowAchievements, showAchievements)}
                        />
                    </div>
                </div>

                <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                    <CardMenu
                        item={item}
                        handleIdle={handleIdle}
                        viewAchievments={(item) => viewAchievments(item, setAppId, setAppName, setShowAchievements, showAchievements)}
                        viewStorePage={viewStorePage}
                        viewGameSettings={(item) => viewGameSettings(item, setAppId, setAppName, setSettingsModalOpen)}
                    />
                </div>
            </div>
        </Fragment>
    );
}