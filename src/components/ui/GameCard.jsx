import { Button } from '@heroui/react';
import Image from 'next/image';
import { useContext } from 'react';
import { TbAwardFilled, TbPlayerPlayFilled, TbPlayerStopFilled } from 'react-icons/tb';

import { IdleContext } from '@/components/contexts/IdleContext';
import { StateContext } from '@/components/contexts/StateContext';
import CardMenu from '@/components/gameslist/CardMenu';
import IdleTimer from '@/components/ui/IdleTimer';
import { handleIdle, handleStopIdle, viewAchievments, viewGameSettings, viewStorePage } from '@/utils/gameslist/gameCardHandler';

export default function GameCard({ item, setSettingsModalOpen }) {
    const { idleGamesList, setIdleGamesList } = useContext(IdleContext);
    const { isDarkMode, setAppId, setAppName, setShowAchievements } = useContext(StateContext);

    const idlingGame = idleGamesList.find((game) => game.appid === item.appid);
    const isIdling = idlingGame !== undefined;

    const handleImageError = (event) => {
        event.target.src = '/fallback.jpg';
    };

    return (
        <div className='relative group select-none'>
            <div className='aspect-[460/215] rounded-xl overflow-hidden transition-transform duration-200 ease-in-out transform group-hover:scale-105'>
                {isIdling && (<IdleTimer startTime={idlingGame.startTime} />)}
                <Image
                    src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
                    width={460}
                    height={215}
                    alt={`${item.name} image`}
                    priority={true}
                    onError={handleImageError}
                />
                <div className={`absolute flex items-center justify-evenly inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-200 ${isDarkMode && 'bg-opacity-20 group-hover:bg-opacity-50'}`}>
                    <div className='absolute flex justify-center w-full bottom-0 left-0 px-2 pb-0.5 opacity-0 group-hover:opacity-100 duration-200'>
                        <p className='text-sm text-offwhite bg-black bg-opacity-50 rounded-sm px-1 select-none truncate'>
                            {item.name}
                        </p>
                    </div>

                    <Button
                        isIconOnly
                        size='md'
                        className='flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 hover:scale-105  active:scale-95 duration-200 rounded-lg bg-opacity-50 bg-black'
                        startContent={
                            <div className='p-2 bg-black text-offwhite bg-opacity-10 hover:bg-black hover:bg-opacity-40 cursor-pointer rounded-lg duration-200'>
                                {isIdling ? (
                                    <TbPlayerStopFilled
                                        className='text-offwhite opacity-0 group-hover:opacity-100 duration-200'
                                        fontSize={32}
                                    />
                                ) : (
                                    <TbPlayerPlayFilled
                                        className='text-offwhite opacity-0 group-hover:opacity-100 duration-200'
                                        fontSize={32}
                                    />
                                )}
                            </div>
                        }
                        onPress={() => isIdling ? handleStopIdle(item, idleGamesList, setIdleGamesList) : handleIdle(item)}
                    />
                    <Button
                        isIconOnly
                        size='md'
                        className='flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 hover:scale-105  active:scale-95 duration-200 rounded-lg bg-opacity-50 bg-black'
                        startContent={
                            <div className='p-2 bg-black text-offwhite bg-opacity-10 hover:bg-black hover:bg-opacity-40 cursor-pointer rounded-lg duration-200'>
                                <TbAwardFilled
                                    className='text-offwhite opacity-0 group-hover:opacity-100 duration-200'
                                    fontSize={32}
                                />
                            </div>
                        }
                        onPress={() => viewAchievments(item, setAppId, setAppName, setShowAchievements)}
                    />
                </div>
            </div>

            {setSettingsModalOpen && (
                <div className='absolute top-0.5 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                    <CardMenu
                        item={item}
                        handleIdle={handleIdle}
                        viewAchievments={(item) => viewAchievments(item, setAppId, setAppName, setShowAchievements)}
                        viewStorePage={viewStorePage}
                        viewGameSettings={(item) => viewGameSettings(item, setAppId, setAppName, setSettingsModalOpen)}
                    />
                </div>
            )}
        </div>
    );
}