import { Fragment, useContext, useEffect } from 'react';

import { AppContext } from '@/components/layout/AppContext';
import { antiAwayStatus } from '@/utils/utils';
import Header from '@/components/ui/Header';
import SideBar from '@/components/ui/SideBar';
import CardFarming from '@/components/automation/CardFarming';
import AchievementUnlocker from '@/components/automation/AchievementUnlocker';
import Achievements from '@/components/achievements/Achievements';
import FreeGamesList from '@/components/gameslist/FreeGamesList';
import GamesList from '@/components/gameslist/GamesList';
import Settings from '@/components/settings/Settings';
import CustomList from '@/components/customlists/CustomList';

export default function Dashboard({ setInitUpdate, setUpdateManifest }) {
    const { activePage, setActivePage, showAchievements, isCardFarming, isAchievementUnlocker } = useContext(AppContext);

    useEffect(() => {
        setActivePage('games');
        antiAwayStatus();
    }, []);

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
                <Fragment>
                    <SideBar />
                    <CustomList key={activePage} type={customListMap[activePage]} />
                </Fragment>
            );
        }

        switch (activePage) {
            case 'freeGames':
                return (
                    <Fragment>
                        <SideBar />
                        <FreeGamesList />
                    </Fragment>
                );
            case 'settings':
                return (
                    <Fragment>
                        <SideBar />
                        <Settings setInitUpdate={setInitUpdate} setUpdateManifest={setUpdateManifest} />
                    </Fragment>
                );
            default:
                return (
                    <Fragment>
                        <SideBar />
                        <GamesList />
                    </Fragment>
                );
        }
    };

    return (
        <Fragment>
            <Header />
            <div className='flex w-full'>
                {renderContent()}
            </div>
            {isCardFarming && <CardFarming activePage={activePage} />}
            {isAchievementUnlocker && <AchievementUnlocker activePage={activePage} />}
        </Fragment>
    );
}