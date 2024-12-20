import React from 'react';
import Dashboard from './Dashboard';
import Setup from './Setup';
import UpdateScreen from '../../updates/components/UpdateScreen';
import ChangelogModal from '../../updates/components/ChangelogModal';
import useWindow from '../hooks/useWindow';

export default function Window() {
    const {
        userSummary,
        setUserSummary,
        updateManifest,
        initUpdate,
        setInitUpdate,
        setUpdateManifest,
        showFreeGamesTab,
        freeGamesList,
        showChangelogModal,
        setShowChangelogModal
    } = useWindow();

    if (initUpdate) return (
        <UpdateScreen updateManifest={updateManifest} />
    );

    if (!userSummary) return (
        <Setup setUserSummary={setUserSummary} />
    );

    return (
        <React.Fragment>
            <div className='bg-base min-h-screen max-h-[calc(100vh-62px)]'>
                <Dashboard
                    userSummary={userSummary}
                    setUserSummary={setUserSummary}
                    setInitUpdate={setInitUpdate}
                    setUpdateManifest={setUpdateManifest}
                    showFreeGamesTab={showFreeGamesTab}
                    freeGamesList={freeGamesList}
                />
                <ChangelogModal showChangelogModal={showChangelogModal} setShowChangelogModal={setShowChangelogModal} />
            </div>
        </React.Fragment>
    );
}