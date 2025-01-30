import { Fragment, useContext, useEffect } from 'react';

import { AppContext } from '@/src/components/layout/AppContext';
import { antiAwayStatus } from '@/src/utils/utils';
import Header from '@/src/components/ui/Header';
import SideBar from '@/src/components/ui/SideBar';
import CardFarming from '@/src/components/automation/CardFarming';
import AchievementUnlocker from '@/src/components/automation/AchievementUnlocker';
import Achievements from '@/src/components/achievements/Achievements';
import FreeGamesList from '@/src/components/gameslist/FreeGamesList';
import GamesList from '@/src/components/gameslist/GamesList';
import Settings from '@/src/components/settings/Settings';
import CustomList from '@/src/components/customlists/CustomList';

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