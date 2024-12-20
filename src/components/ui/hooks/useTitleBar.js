import { useState, useEffect } from 'react';
import { setupAppWindow } from '../utils/titleBarHandler';

export default function useTitleBar() {
    const [appWindow, setAppWindow] = useState();

    useEffect(() => {
        setupAppWindow().then(setAppWindow);
    }, []);

    const windowMinimize = () => {
        appWindow?.minimize();
    };

    const windowToggleMaximize = () => {
        appWindow?.toggleMaximize();
    };

    const windowClose = () => {
        appWindow?.close();
    };

    return {
        windowMinimize,
        windowToggleMaximize,
        windowClose,
    };
}
