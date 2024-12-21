import React, { useContext } from 'react';
import PageHeader from './PageHeader';
import GameCard from './GameCard';
import Private from './Private';
import Loader from '@/src/components/ui/components/Loader';
import useGamesList from '../hooks/useGamesList';
import { AppContext } from '../../layouts/components/AppContext';

export default function GamesList() {
    const { showAchievements } = useContext(AppContext);

    const {
        scrollContainerRef,
        isLoading,
        gameList,
        filteredGames,
        visibleGames,
        favorites,
        cardFarming,
        autoIdle,
        achievementUnlocker,
        sortStyle,
        setSortStyle,
        setFavorites,
        setCardFarming,
        setAutoIdle,
        setAchievementUnlocker,
        refreshKey,
        setRefreshKey,
    } = useGamesList();

    if (isLoading) return <Loader />;

    if (!gameList) return <Private setRefreshKey={setRefreshKey} />;

    return (
        <React.Fragment key={refreshKey}>
            <div className='w-calc min-h-calc max-h-calc overflow-y-auto overflow-x-hidden' ref={scrollContainerRef}>
                {!showAchievements && (
                    <div className={`fixed w-[calc(100vw-72px)] z-[50] bg-opacity-90 backdrop-blur-md bg-base pl-4 pt-2 ${filteredGames?.length > 25 ? 'pr-4' : 'pr-2'}`}>
                        <PageHeader
                            sortStyle={sortStyle}
                            setSortStyle={setSortStyle}
                            filteredGames={filteredGames}
                            visibleGames={visibleGames}
                            setFavorites={setFavorites}
                            setRefreshKey={setRefreshKey}
                        />
                    </div>
                )}

                <div className='p-4 pt-2'>
                    <div className='mt-[60px]'>
                        <GameCard
                            gameList={visibleGames}
                            favorites={favorites}
                            cardFarming={cardFarming}
                            achievementUnlocker={achievementUnlocker}
                            autoIdle={autoIdle}
                            setFavorites={setFavorites}
                            setCardFarming={setCardFarming}
                            setAutoIdle={setAutoIdle}
                            setAchievementUnlocker={setAchievementUnlocker}
                        />
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}