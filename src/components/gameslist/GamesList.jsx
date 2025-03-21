import { useContext, useState } from 'react';

import { StateContext } from '@/components/contexts/StateContext';
import GameSettings from '@/components/gameslist/GameSettings';
import PageHeader from '@/components/gameslist/PageHeader';
import Private from '@/components/gameslist/Private';
import GameCard from '@/components/ui/GameCard';
import Loader from '@/components/ui/Loader';
import useGamesList from '@/hooks/gameslist/useGamesList';

export default function GamesList() {
    const { showAchievements } = useContext(StateContext);
    const {
        scrollContainerRef,
        isLoading,
        gamesList,
        filteredGames,
        visibleGames,
        sortStyle,
        setSortStyle,
        refreshKey,
        setRefreshKey,
    } = useGamesList();
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);

    if (isLoading) return (
        <div className='bg-base overflow-y-auto overflow-x-hidden rounded-tl-xl border-t border-l border-border'>
            <Loader />
        </div>
    );

    if (gamesList.length === 0) return (
        <div className='w-calc min-h-calc max-h-calc bg-base overflow-y-auto overflow-x-hidden rounded-tl-xl border-t border-l border-border'>
            <Private setRefreshKey={setRefreshKey} />
        </div>
    );

    return (
        <div
            key={refreshKey}
            className='w-calc min-h-calc max-h-calc bg-base overflow-y-auto overflow-x-hidden rounded-tl-xl border-t border-l border-border'
            ref={scrollContainerRef}
        >
            {!showAchievements && (
                <PageHeader
                    sortStyle={sortStyle}
                    setSortStyle={setSortStyle}
                    filteredGames={filteredGames}
                    visibleGames={visibleGames}
                    setRefreshKey={setRefreshKey}
                />
            )}

            <div className='grid grid-cols-5 2xl:grid-cols-7 gap-4 p-4 mt-[52px]'>
                {filteredGames && filteredGames.slice(0, visibleGames.length).map((item) => (
                    <GameCard
                        key={item.appid}
                        item={item}
                        setSettingsModalOpen={setSettingsModalOpen}
                    />
                ))}
            </div>

            <GameSettings isOpen={isSettingsModalOpen} onOpenChange={setSettingsModalOpen} />
        </div>
    );
}