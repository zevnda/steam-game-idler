import { Fragment, useContext } from 'react';

import { AppContext } from '@/components/contexts/AppContext';
import { UserContext } from '../contexts/UserContext';
import Dashboard from '@/components/layout/Dashboard';
import Setup from '@/components/layout/Setup';
import useWindow from '@/hooks/layout/useWindow';
import ChangelogModal from '../ui/ChangelogModal';

export default function Window() {
    const { userSummary } = useContext(UserContext);
    const { showChangelog } = useContext(AppContext);
    useWindow();

    if (!userSummary) return (
        <Setup />
    );

    return (
        <Fragment>
            <div className='bg-titlebar min-h-calc'>
                <Dashboard />
                <ChangelogModal />
            </div>
        </Fragment>
    );
}