import { useEffect } from 'react';
import type { ReactElement } from 'react';

import Achievements from '@/components/achievements/Achievements';
import AchievementUnlocker from '@/components/automation/AchievementUnlocker';
import CardFarming from '@/components/automation/CardFarming';
import { useNavigationContext } from '@/components/contexts/NavigationContext';
import { useStateContext } from '@/components/contexts/StateContext';
import CustomList from '@/components/customlists/CustomList';
import FreeGamesList from '@/components/gameslist/FreeGamesList';
import GamesList from '@/components/gameslist/GamesList';
import IdlingGamesList from '@/components/gameslist/IdlingGamesList';
import Settings from '@/components/settings/Settings';
import Header from '@/components/ui/header/Header';
import SideBar from '@/components/ui/SideBar';
import type { ActivePageType, CustomListType } from '@/types';
import { antiAwayStatus } from '@/utils/tasks';

export default function Dashboard(): ReactElement {
    const { showAchievements, isCardFarming, isAchievementUnlocker } = useStateContext();
    const { activePage, setActivePage } = useNavigationContext();

    useEffect(() => {
        setActivePage('games' as ActivePageType);
        antiAwayStatus();
    }, [setActivePage]);

    const renderContent = (): ReactElement => {
        if (showAchievements) return <Achievements />;

        const customListMap: Record<string, CustomListType> = {
            'customlists/card-farming': 'cardFarmingList',
            'customlists/achievement-unlocker': 'achievementUnlockerList',
            'customlists/auto-idle': 'autoIdleList',
            'customlists/favorites': 'favoritesList'
        };

        if (customListMap[activePage]) {
            return <CustomList key={activePage} type={customListMap[activePage]} />;
        }

        switch (activePage) {
            case 'idling':
                return <IdlingGamesList />;
            case 'freeGames':
                return <FreeGamesList />;
            case 'settings':
                return <Settings />;
            default:
                return <GamesList />;
        }
    };

    return (
        <>
            <Header />
            <div className='flex w-full'>
                {!showAchievements && <SideBar />}
                {renderContent()}
            </div>
            {isCardFarming && <CardFarming activePage={activePage} />}
            {isAchievementUnlocker && <AchievementUnlocker activePage={activePage} />}
        </>
    );
}