use std::sync::Mutex;

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{image::Image, AppHandle, Emitter, Manager, State};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_updater::UpdaterExt;

use crate::platform;

/// Emitted right before a tray-started update downloads and installs, and again if that then
/// fails, so the frontend can mirror its own `performUpdate` flow (`useCheckForUpdates.ts`): show
/// `UpdateLoader`, and keep the old-install prompt (`LegacyInstallPrompt.tsx`) from opening over an
/// update that's about to restart the app.
const TRAY_UPDATE_STARTED_EVENT: &str = "tray-update-started";
const TRAY_UPDATE_FAILED_EVENT: &str = "tray-update-failed";

/// English fallback for the "no updates" notification, used until the frontend has pushed the
/// translated text (`update_tray_menu`). Matches `tray.noUpdates` in `en-US.json`.
const DEFAULT_NO_UPDATES_TEXT: &str = "No updates available";

/// Translated text for the tray's own native notifications. Rust has no access to i18next, so
/// the frontend pushes these down with the menu labels (`useTraySync.ts`), and the tray's
/// update check reads them from here.
pub struct TrayStrings {
    no_updates: Mutex<String>,
}

impl Default for TrayStrings {
    fn default() -> Self {
        Self {
            no_updates: Mutex::new(DEFAULT_NO_UPDATES_TEXT.to_string()),
        }
    }
}

/// The only way to recover the window once `close_to_tray`/`start_minimized` has hidden it (see
/// `settings::Settings` and `lib.rs::setup_window`) - a frameless/custom-chrome window has no OS
/// taskbar entry to click once hidden. Tray menu (`Show`/`Reset Window Position`/
/// `Check for updates..`/`Quit`), with the update item dropped for builds that can't self-update
/// (see `platform::can_auto_update`'s doc comment - not the same thing as `is_portable`).
pub fn setup(app_handle: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app_handle, "show", "Show", true, None::<&str>)?;
    let recenter = MenuItem::with_id(
        app_handle,
        "recenter",
        "Reset Window Position",
        true,
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app_handle, "quit", "Quit", true, None::<&str>)?;

    let menu = if !platform::can_auto_update() {
        Menu::with_items(app_handle, &[&show, &recenter, &quit])?
    } else {
        let update = MenuItem::with_id(
            app_handle,
            "update",
            "Check for updates..",
            true,
            None::<&str>,
        )?;
        Menu::with_items(app_handle, &[&show, &recenter, &update, &quit])?
    };

    let icon = Image::from_bytes(include_bytes!("../icons/32x32.png"))?;

    TrayIconBuilder::with_id("main")
        .icon(icon)
        .tooltip("Steam Game Idler")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => show_main_window(app),
            "recenter" => recenter_window(app),
            "update" => {
                // `check_for_updates` is async (network round trip); a plain `fn` menu-event
                // callback has no ambient Tokio runtime context, so this must go through
                // `tauri::async_runtime::spawn` rather than a bare `tokio::spawn`, which would
                // panic with "no reactor running".
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(err) = check_for_updates(&app_handle).await {
                        tracing::warn!(?err, "tray: update check failed");
                    }
                });
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .build(app_handle)?;

    Ok(())
}

/// Rebuilds the tray menu with translated labels. Called from the frontend (`useTraySync.ts`) on
/// mount and whenever the user's language changes - the tray itself has no React tree to read
/// `useTranslation()` from, so the frontend pushes the already-translated strings down instead.
/// Mirrors `main`'s `update_tray_menu` command.
#[tauri::command]
pub fn update_tray_menu(
    app_handle: AppHandle,
    strings: State<'_, TrayStrings>,
    show: String,
    recenter: String,
    update: String,
    quit: String,
    no_updates: String,
) -> Result<(), String> {
    // A poisoned lock only means a panic mid-write of a plain String; the value is still usable.
    *strings
        .no_updates
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner()) = no_updates;

    let show_item = MenuItem::with_id(&app_handle, "show", &show, true, None::<&str>)
        .map_err(|err| err.to_string())?;
    let recenter_item = MenuItem::with_id(&app_handle, "recenter", &recenter, true, None::<&str>)
        .map_err(|err| err.to_string())?;
    let quit_item = MenuItem::with_id(&app_handle, "quit", &quit, true, None::<&str>)
        .map_err(|err| err.to_string())?;

    let menu = if !platform::can_auto_update() {
        Menu::with_items(&app_handle, &[&show_item, &recenter_item, &quit_item])
    } else {
        let update_item = MenuItem::with_id(&app_handle, "update", &update, true, None::<&str>)
            .map_err(|err| err.to_string())?;
        Menu::with_items(
            &app_handle,
            &[&show_item, &recenter_item, &update_item, &quit_item],
        )
    }
    .map_err(|err| err.to_string())?;

    let Some(tray) = app_handle.tray_by_id("main") else {
        return Err("tray icon not found".to_string());
    };
    tray.set_menu(Some(menu)).map_err(|err| err.to_string())
}

fn show_main_window(app_handle: &AppHandle) {
    let Some(window) = app_handle.get_webview_window("main") else {
        tracing::warn!("tray: show requested but the main window handle is missing");
        return;
    };

    // `hide()`'d (not minimized) windows don't need `unminimize()`, but `start_minimized`
    // launches leave the window in whatever minimize state Windows/window-state restored - cover
    // both origins here rather than assuming which one the window was last left in.
    if let Err(err) = window.unminimize() {
        tracing::warn!(?err, "tray: failed to unminimize main window");
    }
    if let Err(err) = window.show() {
        tracing::warn!(?err, "tray: failed to show main window");
    }
    if let Err(err) = window.set_focus() {
        tracing::warn!(?err, "tray: failed to focus main window");
    }
}

/// Must match `tauri.conf.json`'s `app.windows[0].width`/`height` - the size a brand-new install
/// gets on first launch, and what "Reset Window Position" restores a resized/maximized window to.
const DEFAULT_WINDOW_WIDTH: u32 = 1300;
const DEFAULT_WINDOW_HEIGHT: u32 = 850;

/// Forces the window onto a detected monitor (preferring the primary monitor), resets it to the
/// default size, and centers it - recovers a window left off-screen or badly sized, e.g. after a
/// monitor is unplugged, a multi-monitor layout changes, or the user resized/maximized it into an
/// awkward state. Mirrors `main`'s `recenter_window`. Each step is logged-and-continued rather than
/// aborting the whole action, since a failure part-way through (e.g. no monitor detected) should
/// still fall through to showing/focusing whatever position the window already has.
fn recenter_window(app_handle: &AppHandle) {
    let Some(window) = app_handle.get_webview_window("main") else {
        tracing::warn!("tray: recenter requested but the main window handle is missing");
        return;
    };

    if let Err(err) = window.unminimize() {
        tracing::warn!(
            ?err,
            "tray: failed to unminimize main window before recenter"
        );
    }

    // A maximized window ignores `set_size` on most backends, so it must be unmaximized first for
    // the size reset below to actually take visual effect.
    match window.is_maximized() {
        Ok(true) => {
            if let Err(err) = window.unmaximize() {
                tracing::warn!(?err, "tray: failed to unmaximize main window for recenter");
            }
        }
        Ok(false) => {}
        Err(err) => tracing::warn!(?err, "tray: failed to read maximized state for recenter"),
    }

    if let Err(err) = window.set_size(tauri::Size::Logical(tauri::LogicalSize {
        width: DEFAULT_WINDOW_WIDTH as f64,
        height: DEFAULT_WINDOW_HEIGHT as f64,
    })) {
        tracing::warn!(?err, "tray: failed to reset main window size for recenter");
    }

    let monitor = window
        .primary_monitor()
        .inspect_err(|err| tracing::warn!(?err, "tray: failed to read primary monitor"))
        .ok()
        .flatten()
        .or_else(|| {
            window
                .available_monitors()
                .inspect_err(|err| tracing::warn!(?err, "tray: failed to list monitors"))
                .ok()
                .and_then(|monitors| monitors.into_iter().next())
        });

    if let Some(monitor) = monitor {
        match window.outer_size() {
            Ok(window_size) => {
                let monitor_pos = monitor.position();
                let monitor_size = monitor.size();
                let x = monitor_pos.x + (monitor_size.width as i32 - window_size.width as i32) / 2;
                let y =
                    monitor_pos.y + (monitor_size.height as i32 - window_size.height as i32) / 2;

                if let Err(err) =
                    window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
                {
                    tracing::warn!(?err, "tray: failed to set window position for recenter");
                }
            }
            Err(err) => tracing::warn!(?err, "tray: failed to read window size for recenter"),
        }
    } else {
        tracing::warn!("tray: recenter requested but no monitor could be detected");
    }

    if let Err(err) = window.show() {
        tracing::warn!(?err, "tray: failed to show main window after recenter");
    }
    if let Err(err) = window.set_focus() {
        tracing::warn!(?err, "tray: failed to focus main window after recenter");
    }
}

/// Mirrors the frontend's `performUpdate` (`shared/utils/update.ts`) for the one path that bypasses
/// it entirely - the tray runs on the Rust side with no React tree to drive
/// `UpdateLoader`/`updateStore`, so it can't reuse that flow directly. Kills every live
/// `SteamUtility.exe` between the download and the install, same as the frontend does (see that
/// function's comment for why not before the download), so the installer can actually overwrite it
/// (see `updater::kill_all_steam_utility_processes`'s doc comment). Unlike the frontend flow -
/// which defers a non-major update to `UpdateButton`'s opt-in prompt - this always installs
/// immediately once found, since the tray has no UI to show that prompt in. The frontend still
/// hears about it ([`TRAY_UPDATE_STARTED_EVENT`]/[`TRAY_UPDATE_FAILED_EVENT`]) so it can treat it
/// like one of its own installs.
async fn check_for_updates(app_handle: &AppHandle) -> tauri_plugin_updater::Result<()> {
    let Some(update) = app_handle.updater()?.check().await? else {
        let title = app_handle
            .state::<TrayStrings>()
            .no_updates
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
            .clone();
        if let Err(err) = app_handle.notification().builder().title(title).show() {
            tracing::warn!(?err, "tray: failed to show no-update notification");
        }
        return Ok(());
    };

    tracing::info!(version = %update.version, "tray: installing update");
    emit_update_event(app_handle, TRAY_UPDATE_STARTED_EVENT);
    if let Err(err) = download_kill_and_install(app_handle, &update).await {
        emit_update_event(app_handle, TRAY_UPDATE_FAILED_EVENT);
        return Err(err);
    }
    app_handle.restart();
}

async fn download_kill_and_install(
    app_handle: &AppHandle,
    update: &tauri_plugin_updater::Update,
) -> tauri_plugin_updater::Result<()> {
    let bytes = update.download(|_downloaded, _total| {}, || {}).await?;

    if let Err(err) = crate::updater::kill_all_steam_utility_processes(
        app_handle.state(),
        app_handle.state(),
        app_handle.state(),
    )
    .await
    {
        tracing::warn!(
            ?err,
            "tray: failed to kill SteamUtility.exe processes before update install"
        );
    }

    update.install(bytes)
}

fn emit_update_event(app_handle: &AppHandle, event: &str) {
    if let Err(err) = app_handle.emit(event, ()) {
        tracing::warn!(
            ?err,
            event,
            "tray: failed to notify the frontend about the update"
        );
    }
}
