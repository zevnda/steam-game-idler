use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{image::Image, AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_updater::UpdaterExt;

use crate::platform;

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
    show: String,
    recenter: String,
    update: String,
    quit: String,
) -> Result<(), String> {
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

/// Forces the window onto a detected monitor (preferring the primary monitor) and centers it -
/// recovers a window left off-screen, e.g. after a monitor is unplugged or a multi-monitor layout
/// changes. Mirrors `main`'s `recenter_window`. Each step is logged-and-continued rather than
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
/// `SteamUtility.exe` first, same as the frontend does, so the installer can actually overwrite it
/// (see `updater::kill_all_steam_utility_processes`'s doc comment). Unlike the frontend flow -
/// which defers a non-major update to `UpdateButton`'s opt-in prompt - this always installs
/// immediately once found, since the tray has no UI to show that prompt in.
async fn check_for_updates(app_handle: &AppHandle) -> tauri_plugin_updater::Result<()> {
    let Some(update) = app_handle.updater()?.check().await? else {
        if let Err(err) = app_handle
            .notification()
            .builder()
            .title("No updates available")
            .show()
        {
            tracing::warn!(?err, "tray: failed to show no-update notification");
        }
        return Ok(());
    };

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

    tracing::info!(version = %update.version, "tray: installing update");
    update
        .download_and_install(|_downloaded, _total| {}, || {})
        .await?;
    app_handle.restart();
}
