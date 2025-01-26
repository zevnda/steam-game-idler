import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

export function windowMinimize(appWindow) {
    appWindow?.minimize();
}

export function windowToggleMaximize(appWindow) {
    appWindow?.toggleMaximize();
}

export async function windowClose(appWindow) {
    const minToTrayNotified = localStorage.getItem('minToTrayNotified') || 'false';
    appWindow?.hide();
    let permissionGranted = await isPermissionGranted();
    if (minToTrayNotified !== 'true') {
        if (!permissionGranted) {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }
        if (permissionGranted) {
            sendNotification({
                title: 'Steam Game Idler will continue to run in the background',
                icon: 'icons/32x32.png'
            });
        }
    }
    localStorage.setItem('minToTrayNotified', 'true');
}
