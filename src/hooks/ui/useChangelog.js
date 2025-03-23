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

export const transformIssueReferences = (text) => {
    const issueRegex = /(#\d{2,3})\b/g;
    let result = text;

    let match;
    while ((match = issueRegex.exec(text)) !== null) {
        const issueNumber = match[1];
        const issueLink = `https://github.com/zevnda/steam-game-idler/issues/${issueNumber.substring(1)}`;
        const link = `<a href='${issueLink}' target='_blank'>${match[0]}</a>`;
        result = result.replace(match[0], link);
    }

    return result;
};

export const transformMentions = (text) => {
    const userRegex = /@([a-zA-Z0-9_-]+)/g;
    let result = text;

    let match;
    while ((match = userRegex.exec(text)) !== null) {
        const username = match[1];
        const userLink = `https://github.com/${username}`;
        const link = `<a href='${userLink}' target='_blank' rel='noopener noreferrer'>${match[0]}</a>`;
        result = result.replace(match[0], link);
    }

    return result;
};

export const transformLinks = (text) => {
    const linkRegex = /\[(.*?)\]\((https?:\/\/.*?)\)/g;
    let result = text;

    let match;
    while ((match = linkRegex.exec(text)) !== null) {
        const linkText = match[1];
        const linkUrl = match[2];
        const newLink = `<a href='${linkUrl}' target='_blank' rel='noopener noreferrer'>${linkText}</a>`;
        result = result.replace(match[0], newLink);
    }

    return result;
};