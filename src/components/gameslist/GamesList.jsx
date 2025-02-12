import { Fragment, useContext, useState } from 'react';

import { AppContext } from '@/src/components/layout/AppContext';
import PageHeader from '@/src/components/gameslist/PageHeader';
import Private from '@/src/components/gameslist/Private';
import useGamesList from '@/src/hooks/gameslist/useGamesList';
import Loader from '@/src/components/ui/Loader';
import GameCard from '@/src/components/ui/GameCard';
import GameSettings from '@/src/components/gameslist/GameSettings';

export default function GamesList() {
    const { showAchievements } = useContext(AppContext);
    const {
        scrollContainerRef,
        isLoading,
        gameList,
        filteredGames,
        visibleGames,
        sortStyle,
        setSortStyle,
        refreshKey,
        setRefreshKey,
    } = useGamesList();
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

    if (isLoading) return <Loader />;

    if (gameList.length === 0) return <Private setRefreshKey={setRefreshKey} />;

    return (
        <Fragment key={refreshKey}>
            <div className='w-calc min-h-calc max-h-calc overflow-y-auto overflow-x-hidden' ref={scrollContainerRef}>
                {!showAchievements && (
                    <div className={`fixed w-[calc(100vw-66px)] z-[50] bg-opacity-90 backdrop-blur-md bg-base pl-4 pt-2 ${filteredGames?.length > 25 ? 'pr-4' : 'pr-2'}`}>
                        <PageHeader
                            sortStyle={sortStyle}
                            setSortStyle={setSortStyle}
                            filteredGames={filteredGames}
                            visibleGames={visibleGames}
                            setRefreshKey={setRefreshKey}
                        />
                    </div>
                )}

                <div className='grid grid-cols-5 2xl:grid-cols-7 gap-4 p-4 mt-[52px]'>
                    {filteredGames && filteredGames.slice(0, visibleGames.length).map((item) => (
                        <GameCard
                            key={item.appid}
                            item={item}
                            sortedGamesList={filteredGames}
                            visibleGames={gameList}
                            setSettingsModalOpen={setSettingsModalOpen}
                        />
                    ))}
                </div>

                <GameSettings isOpen={isSettingsModalOpen} onOpenChange={setSettingsModalOpen} />
            </div>
        </Fragment>
    );
}