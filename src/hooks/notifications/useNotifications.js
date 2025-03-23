import { open } from '@tauri-apps/plugin-shell';
import { useState, useEffect, useRef } from 'react';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unseenNotifications, setUnseenNotifications] = useState([]);
    const dropdownRef = useRef(null);

    useEffect(() => {
        // Fetch notifications
        fetchNotifications(setNotifications, setUnseenNotifications);
        const interval = setInterval(() => fetchNotifications(setNotifications, setUnseenNotifications), 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Close notification pabnel when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return {
        notifications,
        showNotifications,
        setShowNotifications,
        unseenNotifications,
        setUnseenNotifications,
        dropdownRef,
    };
};

// Fetch notifications and update state
export const fetchNotifications = async (setNotifications, setUnseenNotifications) => {
    const cooldownTimestamp = localStorage.getItem('notificationsCooldown');
    const now = new Date().getTime();

    // Check if cooldown is active and use cached notifications if it is
    if (cooldownTimestamp && now < cooldownTimestamp) {
        const cachedNotifications = JSON.parse(localStorage.getItem('cachedNotifications')) || [];
        setNotifications(cachedNotifications);
        await checkUnseenNotifications(cachedNotifications, setUnseenNotifications);
        return;
    }

    try {
        // Fetch notifications
        const response = await fetch('https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/notifications.json');
        const data = await response.json();
        setNotifications(data.slice(0, 10));
        await checkUnseenNotifications(data.slice(0, 10), setUnseenNotifications);
        // Cache notifications and set cooldown timestamp
        localStorage.setItem('cachedNotifications', JSON.stringify(data.slice(0, 10)));
        localStorage.setItem('notificationsCooldown', now + 30 * 60 * 1000);
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
};

// Check for unseen notifications
export const checkUnseenNotifications = async (notifications, setUnseenNotifications) => {
    const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications')) || [];
    const unseen = notifications.filter(notification => !seenNotifications.includes(notification.id));
    setUnseenNotifications(unseen);
};

// Mark a notification as seen
export const markAsSeen = (id, unseenNotifications, setUnseenNotifications) => {
    const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications')) || [];
    if (!seenNotifications.includes(id)) {
        seenNotifications.push(id);
        localStorage.setItem('seenNotifications', JSON.stringify(seenNotifications));
    }
    setUnseenNotifications(unseenNotifications.filter(notification => notification.id !== id));
};

// Mark all notifications as seen
export const markAllAsSeen = (notifications, setUnseenNotifications) => {
    const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications')) || [];
    notifications.forEach(notification => {
        if (!seenNotifications.includes(notification.id)) {
            if (seenNotifications.length >= 10) {
                seenNotifications.shift();
            }
            seenNotifications.push(notification.id);
        }
    });
    localStorage.setItem('seenNotifications', JSON.stringify(seenNotifications));
    setUnseenNotifications([]);
};

// Handle opening a URL and marking the notification as seen
export const handleOpenUrl = async (url, id, unseenNotifications, setUnseenNotifications) => {
    markAsSeen(id, unseenNotifications, setUnseenNotifications);
    try {
        await open(url);
    } catch (error) {
        console.error('Failed to open link:', error);
    }
};

// Convert timestamp to relative time
export const timeAgo = (timestamp) => {
    const now = new Date();
    const secondsPast = Math.floor((now.getTime() / 1000) - timestamp);

    if (secondsPast < 60) {
        return `${secondsPast}s`;
    }
    if (secondsPast < 3600) {
        return `${Math.floor(secondsPast / 60)}m`;
    }
    if (secondsPast < 86400) {
        return `${Math.floor(secondsPast / 3600)}h`;
    }
    if (secondsPast < 2592000) {
        return `${Math.floor(secondsPast / 86400)}d`;
    }
    if (secondsPast < 31536000) {
        return `${Math.floor(secondsPast / 2592000)}mo`;
    }
    return `${Math.floor(secondsPast / 31536000)}y`;
};
