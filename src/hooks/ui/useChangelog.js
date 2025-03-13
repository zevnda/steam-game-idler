import { getVersion } from '@tauri-apps/api/app';
import { useEffect, useState } from 'react';

export default function useChangelog() {
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

    return { changelog, version };
}