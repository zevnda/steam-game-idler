import React, { useContext, useEffect } from 'react';
import { AppContext } from './AppContext';
import Header from '../../ui/components/Header';
import SideBar from '../../ui/components/SideBar';
import CardFarming from '../../automation/components/CardFarming';
import Achievements from '../../achievements/components/Achievements';
import AchievementUnlocker from '../../automation/components/AchievementUnlocker';
import { antiAwayStatus } from '@/src/utils/utils';
import FreeGamesList from '../../gameslist/components/FreeGamesList';
import GamesList from '../../gameslist/components/GamesList';
import Settings from '../../settings/components/Settings';

export default function Dashboard({ setInitUpdate, setUpdateManifest }) {
    const { activePage, showAchievements } = useContext(AppContext);

    useEffect(() => {
        antiAwayStatus();
    }, []);

    return (
        <React.Fragment>
            <Header />
            <div className='flex w-full'>
                {showAchievements ? (
                    <Achievements />
                ) : activePage === 'games' ? (
                    <React.Fragment>
                        <SideBar />
                        <GamesList />
                    </React.Fragment>
                ) : activePage === 'freeGames' ? (
                    <React.Fragment>
                        <SideBar />
                        <FreeGamesList />
                    </React.Fragment>
                ) : activePage === 'settings' ? (
                    <React.Fragment>
                        <SideBar />
                        <Settings setInitUpdate={setInitUpdate} setUpdateManifest={setUpdateManifest} />
                    </React.Fragment>
                ) : activePage === 'card-farming' ? (
                    <CardFarming />
                ) : (
                    <AchievementUnlocker />
                )}
            </div>
        </React.Fragment>
    );
}