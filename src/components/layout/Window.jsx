import { Fragment, useContext } from 'react';

import { AppContext } from '@/components/layout/AppContext';
import Dashboard from '@/components/layout/Dashboard';
import Setup from '@/components/layout/Setup';
import UpdateScreen from '@/components/updates/UpdateScreen';
import ChangelogModal from '@/components/updates/ChangelogModal';
import useWindow from '@/hooks/layout/useWindow';

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
            <div className='bg-titlebar min-h-calc'>
                <Dashboard setInitUpdate={setInitUpdate} setUpdateManifest={setUpdateManifest} />
                <ChangelogModal showChangelogModal={showChangelogModal} setShowChangelogModal={setShowChangelogModal} />
            </div>
        </Fragment>
    );
}