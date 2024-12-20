export async function setupAppWindow() {
    const appWindow = (await import('@tauri-apps/api/window')).appWindow;
    return appWindow;
}
