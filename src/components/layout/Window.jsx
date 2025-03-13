import { useContext } from 'react';

import { UserContext } from '@/components/contexts/UserContext';
import Dashboard from '@/components/layout/Dashboard';
import Setup from '@/components/layout/Setup';
import ChangelogModal from '@/components/ui/ChangelogModal';
import useWindow from '@/hooks/layout/useWindow';

export default function Window() {
    const { userSummary } = useContext(UserContext);
    useWindow();

    if (!userSummary) return (
        <Setup />
    );

    return (
        <div className='bg-titlebar min-h-calc'>
            <Dashboard />
            <ChangelogModal />
        </div>
    );
}