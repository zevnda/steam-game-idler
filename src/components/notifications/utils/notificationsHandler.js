export const fetchNotifications = async (setNotifications, setUnseenNotifications) => {
    const cooldownTimestamp = localStorage.getItem('notificationsCooldown');
    const now = new Date().getTime();

    if (cooldownTimestamp && now < cooldownTimestamp) {
        const cachedNotifications = JSON.parse(sessionStorage.getItem('cachedNotifications')) || [];
        setNotifications(cachedNotifications);
        checkUnseenNotifications(cachedNotifications, setUnseenNotifications);
        return;
    }

    try {
        const response = await fetch('https://raw.githubusercontent.com/zevnda/steam-game-idler/refs/heads/main/notifications.json');
        const data = await response.json();
        setNotifications(data.slice(0, 10));
        checkUnseenNotifications(data.slice(0, 10), setUnseenNotifications);
        sessionStorage.setItem('cachedNotifications', JSON.stringify(data.slice(0, 10)));
        localStorage.setItem('notificationsCooldown', now + 30 * 60 * 1000);
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
};

export const checkUnseenNotifications = (notifications, setUnseenNotifications) => {
    const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications')) || [];
    const unseen = notifications.filter(notification => !seenNotifications.includes(notification.id));
    setUnseenNotifications(unseen);
};

export const markAsSeen = (id, unseenNotifications, setUnseenNotifications) => {
    let seenNotifications = JSON.parse(localStorage.getItem('seenNotifications')) || [];
    if (!seenNotifications.includes(id)) {
        if (seenNotifications.length >= 10) {
            seenNotifications.shift();
        }
        seenNotifications.push(id);
        localStorage.setItem('seenNotifications', JSON.stringify(seenNotifications));
    }
    setUnseenNotifications(unseenNotifications.filter(notification => notification.id !== id));
};

export const markAllAsSeen = (notifications, setUnseenNotifications) => {
    let seenNotifications = JSON.parse(localStorage.getItem('seenNotifications')) || [];
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

export const handleOpenUrl = async (e, url, id, markAsSeen, unseenNotifications, setUnseenNotifications) => {
    e.preventDefault();
    markAsSeen(id, unseenNotifications, setUnseenNotifications);
    if (url && typeof window !== 'undefined' && window.__TAURI__) {
        try {
            await window.__TAURI__.shell.open(url);
        } catch (error) {
            console.error('Failed to open link:', error);
        }
    }
};