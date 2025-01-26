import { useState, useEffect } from 'react';
import { setupAppWindow } from '@/src/utils/ui/titleBarHandler';

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
