import { useContext, useEffect } from 'react';

import Achievements from '@/components/achievements/Achievements';
import AchievementUnlocker from '@/components/automation/AchievementUnlocker';
import CardFarming from '@/components/automation/CardFarming';
import { NavigationContext } from '@/components/contexts/NavigationContext';
import { StateContext } from '@/components/contexts/StateContext';
import CustomList from '@/components/customlists/CustomList';
import FreeGamesList from '@/components/gameslist/FreeGamesList';
import GamesList from '@/components/gameslist/GamesList';
import IdlingGamesList from '@/components/gameslist/IdlingGamesList';
import Settings from '@/components/settings/Settings';
import Header from '@/components/ui/Header';
import SideBar from '@/components/ui/SideBar';
import { antiAwayStatus } from '@/utils/global/tasks';

export default function Dashboard() {
    const { showAchievements, isCardFarming, isAchievementUnlocker } = useContext(StateContext);
    const { activePage, setActivePage } = useContext(NavigationContext);

    useEffect(() => {
        setActivePage('games');
        antiAwayStatus();
    }, [setActivePage]);

    const renderContent = () => {
        if (showAchievements) return <Achievements />;

        const customListMap = {
            'customlists/card-farming': 'cardFarmingList',
            'customlists/achievement-unlocker': 'achievementUnlockerList',
            'customlists/auto-idle': 'autoIdleList',
            'customlists/favorites': 'favoritesList'
        };

        if (customListMap[activePage]) {
            return (
                <>
                    <SideBar />
                    <CustomList key={activePage} type={customListMap[activePage]} />
                </>
            );
        }

        switch (activePage) {
            case 'idling':
                return (
                    <>
                        <SideBar />
                        <IdlingGamesList />
                    </>
                );
            case 'freeGames':
                return (
                    <>
                        <SideBar />
                        <FreeGamesList />
                    </>
                );
            case 'settings':
                return (
                    <>
                        <SideBar />
                        <Settings />
                    </>
                );
            default:
                return (
                    <>
                        <SideBar />
                        <GamesList />
                    </>
                );
        }
    };

    return (
        <>
            <Header />
            <div className='flex w-full'>
                {renderContent()}
            </div>
            {isCardFarming && <CardFarming activePage={activePage} />}
            {isAchievementUnlocker && <AchievementUnlocker activePage={activePage} />}
        </>
    );
}