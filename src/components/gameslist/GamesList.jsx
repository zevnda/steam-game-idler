import { Fragment, useContext } from 'react';

import { AppContext } from '@/src/components/layout/AppContext';
import PageHeader from '@/src/components/gameslist/PageHeader';
import GameCard from '@/src/components/gameslist/GameCard';
import Private from '@/src/components/gameslist/Private';
import useGamesList from '@/src/hooks/gameslist/useGamesList';
import Loader from '@/src/components/ui/Loader';

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

                <div className='p-4 pt-2'>
                    <div className='mt-[60px]'>
                        <GameCard gameList={visibleGames} />
                    </div>
                </div>
            </div>
        </Fragment>
    );
}