import { useEffect, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';

export default function useChangelog(setShowChangelogModal) {
    const [changelog, setChangelog] = useState('');
    const [version, setVersion] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const currentVersion = await getVersion();
            setVersion(currentVersion);
            const res = await fetch('https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/CHANGELOG.md');
            const data = await res.text();
            setChangelog(data.split('## Changelog')[1]);
        };
        fetchData();
    }, []);

    const handleCloseModal = () => {
        setShowChangelogModal(false);
    };

    return { changelog, version, handleCloseModal };
}
