import { debounce, logEvent } from '@/src/utils/utils';
import { toast } from 'react-toastify';

export async function setupAppWindow() {
    const { appWindow, PhysicalSize, PhysicalPosition, primaryMonitor, availableMonitors } = await import('@tauri-apps/api/window');

    const savedState = localStorage.getItem('windowState');
    let defaultWidth = 1268;
    let defaultHeight = 620;

    async function setToSafePosition() {
        try {
            const monitor = await primaryMonitor();
            const safeX = Math.floor(monitor.size.width * 0.1);
            const safeY = Math.floor(monitor.size.height * 0.1);
            await appWindow.setPosition(new PhysicalPosition(safeX, safeY));
        } catch (error) {
            toast.error(`Error in (setToSafePosition): ${error?.message || error}`);
            console.error('Error in (setToSafePosition):', error);
            logEvent(`[Error] in (setToSafePosition): ${error}`);
        }
    }

    async function isPositionOnScreen(x, y, width, height) {
        try {
            const monitors = await availableMonitors();
            for (const monitor of monitors) {
                if (
                    x < monitor.position.x + monitor.size.width &&
                    x + width > monitor.position.x &&
                    y < monitor.position.y + monitor.size.height &&
                    y + height > monitor.position.y
                ) {
                    return true;
                }
            }
            return false;
        } catch (error) {
            toast.error(`Error in (isPositionOnScreen): ${error?.message || error}`);
            console.error('Error in (isPositionOnScreen):', error);
            logEvent(`[Error] in (isPositionOnScreen): ${error}`);
        }
    }

    if (savedState) {
        const { width, height, isMaximized, positionX, positionY } = JSON.parse(savedState);
        if (isMaximized) {
            await appWindow.maximize();
        } else {
            try {
                const isOnScreen = await isPositionOnScreen(positionX, positionY, width, height);
                if (isOnScreen) {
                    await appWindow.setSize(new PhysicalSize(width, height));
                    await appWindow.setPosition(new PhysicalPosition(positionX, positionY));
                } else {
                    await appWindow.setSize(new PhysicalSize(width, height));
                    await setToSafePosition();
                }
            } catch (error) {
                toast.error(`Error in (setupAppWindow - savedState) - Failed to restore window state: ${error?.message || error}`);
                console.error('Error in (setupAppWindow - savedState) - Failed to restore window state:', error);
                logEvent(`[Error] in (setupAppWindow - savedState) - Failed to restore window state: ${error}`);
                await setToSafePosition();
            }
        }
    } else {
        try {
            await appWindow.setSize(new PhysicalSize(defaultWidth, defaultHeight));
            await setToSafePosition();
        } catch (error) {
            toast.error(`Error in (setupAppWindow - savedState): ${error?.message || error}`);
            console.error('Error in (setupAppWindow - savedState):', error);
            logEvent(`[Error] in (setupAppWindow - savedState): ${error}`);
        }
    }

    const saveWindowState = debounce(async () => {
        try {
            const size = await appWindow.outerSize();
            const position = await appWindow.outerPosition();
            const isMaximized = await appWindow.isMaximized();
            const windowState = {
                width: size.width,
                height: size.height,
                positionX: position.x,
                positionY: position.y,
                isMaximized
            };
            localStorage.setItem('windowState', JSON.stringify(windowState));
        } catch (error) {
            toast.error(`Error in (saveWindowState): ${error?.message || error}`);
            console.error('Error in (saveWindowState):', error);
            logEvent(`[Error] in (saveWindowState): ${error}`);
        }
    }, 500);

    const unlistenResize = await appWindow.onResized(() => saveWindowState());
    const unlistenMove = await appWindow.onMoved(() => saveWindowState());

    return () => {
        unlistenResize();
        unlistenMove();
        saveWindowState.cancel();
    };
}
