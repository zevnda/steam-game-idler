import React, { useContext, useState } from 'react';
import Image from 'next/image';
import CardMenu from './CardMenu';
import { IoPlay } from 'react-icons/io5';
import { FaAward } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import Loader from '@/src/components/ui/components/Loader';
import { AppContext } from '../../layout/components/AppContext';
import { handleIdle, viewAchievments, viewStorePage, addToFavorites, removeFromFavorites, addToCardFarming, removeFromCardFarming, addToAchievementUnlocker, removeFromAchievementUnlocker, addToAutoIdle, removeFromAutoIdle, viewGameSettings } from '@/src/components/gameslist/utils/gameCardHandler';
import GameSettings from './GameSettings';
import { useDisclosure } from '@nextui-org/react';

export default function GameCard({ gameList, favorites, cardFarming, achievementUnlocker, autoIdle, setFavorites, setAchievementUnlocker, setCardFarming, setAutoIdle }) {
    const { setAppId, setAppName, showAchievements, setShowAchievements } = useContext(AppContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [isLoading, setIsLoading] = useState(true);

    setTimeout(() => {
        setIsLoading(false);
    }, 100);

    if (isLoading) return <Loader />;

    return (
        <React.Fragment>
            <div className='grid grid-cols-5 2xl:grid-cols-7 gap-4'>
                {gameList && gameList.map((item) => (
                    <div key={item.appid} className='relative group'>
                        <div className='aspect-[460/215] rounded-lg overflow-hidden transition-transform duration-200 ease-in-out transform group-hover:scale-105'>
                            <Image
                                src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid || item?.game?.id}/header.jpg`}
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
                                <div className='flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 hover:scale-105 duration-200' onClick={() => handleIdle(item)}>
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

                        <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                            <CardMenu
                                item={item}
                                favorites={favorites}
                                cardFarming={cardFarming}
                                achievementUnlocker={achievementUnlocker}
                                autoIdle={autoIdle}
                                handleIdle={handleIdle}
                                viewAchievments={(item) => viewAchievments(item, setAppId, setAppName, setShowAchievements, showAchievements)}
                                viewStorePage={viewStorePage}
                                viewGameSettings={(item) => viewGameSettings(item, setAppId, setAppName, onOpen)}
                                addToFavorites={(item) => addToFavorites(item, setFavorites)}
                                removeFromFavorites={(item) => removeFromFavorites(item, setFavorites)}
                                addToCardFarming={(item) => addToCardFarming(item, setCardFarming)}
                                removeFromCardFarming={(item) => removeFromCardFarming(item, setCardFarming)}
                                addToAchievementUnlocker={(item) => addToAchievementUnlocker(item, setAchievementUnlocker)}
                                removeFromAchievementUnlocker={(item) => removeFromAchievementUnlocker(item, setAchievementUnlocker)}
                                addToAutoIdle={(item) => addToAutoIdle(item, setAutoIdle)}
                                removeFromAutoIdle={(item) => removeFromAutoIdle(item, setAutoIdle)}
                            />
                        </div>
                    </div>
                ))}

                <GameSettings

                    isOpen={isOpen}
                    onOpenChange={onOpenChange}
                />
            </div>
        </React.Fragment>
    );
}