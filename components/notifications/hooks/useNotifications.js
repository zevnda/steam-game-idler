import { useState, useEffect, useRef } from 'react';
import { fetchNotifications, markAsSeen, markAllAsSeen, handleOpenUrl } from '../utils/notificationsHandler';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unseenNotifications, setUnseenNotifications] = useState([]);
    const dropdownRef = useRef(null);

    useEffect(() => {
        fetchNotifications(setNotifications, setUnseenNotifications);
        const interval = setInterval(() => fetchNotifications(setNotifications, setUnseenNotifications), 3600000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
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
        markAsSeen,
        markAllAsSeen,
        handleOpenUrl
    };
};