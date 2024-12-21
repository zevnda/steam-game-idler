import React, { useContext } from 'react';
import Dashboard from './Dashboard';
import Setup from './Setup';
import UpdateScreen from '../../updates/components/UpdateScreen';
import ChangelogModal from '../../updates/components/ChangelogModal';
import useWindow from '../hooks/useWindow';
import { AppContext } from './AppContext';

export default function Window() {
    const { userSummary } = useContext(AppContext);
    const { updateManifest, initUpdate, setInitUpdate, setUpdateManifest, showChangelogModal, setShowChangelogModal } = useWindow();

    if (initUpdate) return (
        <UpdateScreen updateManifest={updateManifest} />
    );

    if (!userSummary) return (
        <Setup />
    );

    return (
        <React.Fragment>
            <div className='bg-base min-h-screen max-h-[calc(100vh-62px)]'>
                <Dashboard setInitUpdate={setInitUpdate} setUpdateManifest={setUpdateManifest} />
                <ChangelogModal showChangelogModal={showChangelogModal} setShowChangelogModal={setShowChangelogModal} />
            </div>
        </React.Fragment>
    );
}