import { useState, useEffect } from 'react';
import { setupAppWindow } from '../utils/titleBarHandler';

export default function useTitleBar() {
    const [appWindow, setAppWindow] = useState();

    useEffect(() => {
        setupAppWindow().then(setAppWindow);
    }, []);

    const windowClose = () => {
        appWindow?.close();
    };

    return {
        windowClose,
    };
}
