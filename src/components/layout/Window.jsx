import { Fragment, useContext } from 'react';

import { AppContext } from '@/src/components/layout/AppContext';
import Dashboard from '@/src/components/layout/Dashboard';
import Setup from '@/src/components/layout/Setup';
import UpdateScreen from '@/src/components/updates/UpdateScreen';
import ChangelogModal from '@/src/components/updates/ChangelogModal';
import useWindow from '@/src/hooks/layout/useWindow';

export default function Window() {
    const { userSummary, initUpdate, setInitUpdate } = useContext(AppContext);
    const { updateManifest, setUpdateManifest, showChangelogModal, setShowChangelogModal } = useWindow();

    if (initUpdate) return (
        <UpdateScreen updateManifest={updateManifest} />
    );

    if (!userSummary) return (
        <Setup />
    );

    return (
        <Fragment>
            <div className='bg-base min-h-screen max-h-[calc(100vh-62px)]'>
                <Dashboard setInitUpdate={setInitUpdate} setUpdateManifest={setUpdateManifest} />
                <ChangelogModal showChangelogModal={showChangelogModal} setShowChangelogModal={setShowChangelogModal} />
            </div>
        </Fragment>
    );
}