import { Fragment, useContext, useEffect } from 'react';

import { AppContext } from './AppContext';
import { antiAwayStatus } from '@/src/utils/utils';
import Header from '@/src/components/ui/Header';
import SideBar from '@/src/components/ui/SideBar';
import CardFarming from '@/src/components/automation/CardFarming';
import AchievementUnlocker from '@/src/components/automation/AchievementUnlocker';
import Achievements from '@/src/components/achievements/Achievements';
import FreeGamesList from '@/src/components/gameslist/FreeGamesList';
import GamesList from '@/src/components/gameslist/GamesList';
import Settings from '@/src/components/settings/Settings';
import AchievementUnlockerList from '@/src/components/customlists/AchievementUnlockerList';
import CardFarmingList from '@/src/components/customlists/CardFarmingList';
import AutoIdleList from '@/src/components/customlists/AutoIdleList';
import FavoritesList from '@/src/components/customlists/FavoritesList';

export default function Dashboard({ setInitUpdate, setUpdateManifest }) {
    const { activePage, setActivePage, showAchievements, isCardFarming, isAchievementUnlocker } = useContext(AppContext);

    useEffect(() => {
        setActivePage('games');
        antiAwayStatus();
    }, []);

    return (
        <Fragment>
            <Header />
            <div className='flex w-full'>
                {showAchievements ? (
                    <Achievements />
                ) : activePage === 'customlists/card-farming' ? (
                    <Fragment>
                        <SideBar />
                        <CardFarmingList />
                    </Fragment>
                ) : activePage === 'customlists/achievement-unlocker' ? (
                    <Fragment>
                        <SideBar />
                        <AchievementUnlockerList />
                    </Fragment>
                ) : activePage === 'customlists/auto-idle' ? (
                    <Fragment>
                        <SideBar />
                        <AutoIdleList />
                    </Fragment>
                ) : activePage === 'customlists/favorites' ? (
                    <Fragment>
                        <SideBar />
                        <FavoritesList />
                    </Fragment>
                ) : activePage === 'freeGames' ? (
                    <Fragment>
                        <SideBar />
                        <FreeGamesList />
                    </Fragment>
                ) : activePage === 'settings' ? (
                    <Fragment>
                        <SideBar />
                        <Settings setInitUpdate={setInitUpdate} setUpdateManifest={setUpdateManifest} />
                    </Fragment>
                ) : (
                    <Fragment>
                        <SideBar />
                        <GamesList />
                    </Fragment>
                )}
            </div>

            {isCardFarming && (
                <CardFarming activePage={activePage} />
            )}
            {isAchievementUnlocker && (
                <AchievementUnlocker activePage={activePage} />
            )}
        </Fragment>
    );
}