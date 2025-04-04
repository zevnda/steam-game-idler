import { Spinner } from '@heroui/react';
import type { ReactElement } from 'react';

import { useStateContext } from '@/components/contexts/StateContext';
import PageHeader from '@/components/gameslist/PageHeader';
import Private from '@/components/gameslist/Private';
import GameCard from '@/components/ui/GameCard';
import useGamesList from '@/hooks/gameslist/useGamesList';

export default function GamesList(): ReactElement {
    const { showAchievements } = useStateContext();
    const gamesContext = useGamesList();

    if (!gamesContext.isLoading && gamesContext.gamesList.length === 0) return (
        <div className='w-calc min-h-calc max-h-calc bg-base overflow-y-auto overflow-x-hidden rounded-tl-xl border-t border-l border-border'>
            <Private setRefreshKey={gamesContext.setRefreshKey} />
        </div>
    );

    return (
        <div
            key={gamesContext.refreshKey}
            className='w-calc min-h-calc max-h-calc bg-base overflow-y-auto overflow-x-hidden rounded-tl-xl border-t border-l border-border'
            ref={gamesContext.scrollContainerRef}
        >
            {!showAchievements && (
                <PageHeader
                    sortStyle={gamesContext.sortStyle}
                    setSortStyle={gamesContext.setSortStyle}
                    filteredGames={gamesContext.filteredGames}
                    visibleGames={gamesContext.visibleGames}
                    setRefreshKey={gamesContext.setRefreshKey}
                />
            )}

            {!gamesContext.isLoading ? (
                <div className='grid grid-cols-5 2xl:grid-cols-7 gap-4 p-4 mt-[52px]'>
                    {gamesContext.filteredGames && gamesContext.filteredGames.slice(0, gamesContext.visibleGames.length).map((item) => (
                        <GameCard
                            key={item.appid}
                            item={item}
                        />
                    ))}
                </div>
            ) : (
                <div className='flex justify-center items-center w-calc h-[calc(100vh-57px)]'>
                    <Spinner variant='simple' />
                </div>
            )}

        </div>
    );
}