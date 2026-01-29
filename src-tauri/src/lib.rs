#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub mod achievement_manager;
pub mod automation;
pub mod crypto;
pub mod custom_lists;
pub mod game_data;
pub mod idling;
pub mod logging;
pub mod process_handler;
pub mod settings;
pub mod trading_cards;
pub mod user_data;
pub mod utils;
use achievement_manager::*;
use automation::*;
use custom_lists::*;
use game_data::*;
use idling::*;
use logging::*;
use process_handler::*;
use settings::*;
use trading_cards::*;
use user_data::*;
use utils::*;

use std::env;
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Listener, Manager};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_updater::UpdaterExt;
use tauri_plugin_window_state::StateFlags;

pub fn run() {
    // Load environment variables based on the build configuration
    if cfg!(debug_assertions) {
        match crypto::decrypt_api_key() {
            key if !key.is_empty() => unsafe {
                std::env::set_var("KEY", key);
            },
            _ => {
                dotenv::from_filename(".env.development").unwrap().load();
            }
        }
    } else {
        match crypto::decrypt_api_key() {
            key if !key.is_empty() => unsafe {
                std::env::set_var("KEY", key);
            },
            _ => {
                panic!("No obfuscated API key available in production build");
            }
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin({
            let mut builder = tauri_plugin_window_state::Builder::new().with_state_flags(
                StateFlags::SIZE
                    | StateFlags::POSITION
                    | StateFlags::MAXIMIZED
                    | StateFlags::DECORATIONS
                    | StateFlags::FULLSCREEN,
            );

            if is_portable() {
                builder = builder.with_dir("./");
            }

            builder.build()
        })
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(move |app| setup_app(app))
        .invoke_handler(tauri::generate_handler![
            is_dev,
            is_steam_running,
            get_users,
            start_idle,
            stop_idle,
            start_farm_idle,
            stop_farm_idle,
            unlock_achievement,
            lock_achievement,
            toggle_achievement,
            unlock_all_achievements,
            lock_all_achievements,
            update_stats,
            reset_all_stats,
            log_event,
            clear_log_file,
            get_user_summary,
            get_user_summary_cache,
            delete_user_summary_file,
            get_games_list,
            get_recent_games,
            get_games_list_cache,
            delete_user_games_list_files,
            delete_all_cache_files,
            get_custom_lists,
            add_game_to_custom_list,
            remove_game_from_custom_list,
            update_custom_list,
            get_achievement_data,
            validate_session,
            validate_steam_api_key,
            get_drops_remaining,
            get_games_with_drops,
            open_file_explorer,
            get_free_games,
            anti_away,
            get_running_processes,
            kill_process_by_pid,
            kill_all_steamutil_processes,
            get_user_settings,
            update_user_settings,
            reset_user_settings,
            get_trading_cards,
            get_trading_cards_cache,
            update_card_data,
            delete_user_trading_card_file,
            list_trading_cards,
            get_card_price,
            remove_market_listings,
            get_tray_icon,
            is_portable,
            get_cache_dir_path,
            get_achievement_order,
            save_achievement_order,
            start_steam_status_monitor,
            start_processes_monitor,
            open_steam_login_window,
            delete_login_window_cookies,
            open_store_login_window,
            delete_store_cookies,
            redeem_free_game,
            set_zoom,
            quit_app
        ])
        .build(tauri::generate_context!())
        .expect("Error while building tauri application")
        .run(move |_, event| match event {
            tauri::RunEvent::Exit => {
                // Kill all SteamUtil processes on app exit
                tauri::async_runtime::block_on(async {
                    let _ = kill_all_steamutil_processes().await;
                });
            }
            _ => {}
        });
}

fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.handle();
    setup_window(&app_handle)?;
    setup_tray_icon(app)?;

    Ok(())
}

fn setup_window(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let window = app_handle.get_webview_window("main").unwrap();

    // Listen for ready event from frontend
    // Hide the window initially and only show it once the frontend is ready
    // This prevents a blank window from showing during load
    let window_clone = window.clone();
    let app_handle_clone = app_handle.clone();
    window.listen("ready", move |_| {
        // Check if start minimized is enabled
        let app_handle_for_async = app_handle_clone.clone();
        let window_for_async = window_clone.clone();
        tauri::async_runtime::spawn(async move {
            match settings::check_start_minimized_setting(&app_handle_for_async).await {
                Ok(should_start_minimized) => {
                    // If start minimized is enabled, keep the window hidden
                    if !should_start_minimized {
                        window_for_async.show().unwrap();
                    }
                }
                Err(_) => {
                    // If we can't check the setting, default to showing the window
                    window_for_async.show().unwrap();
                }
            }
        });
    });

    Ok(())
}

fn setup_tray_icon(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.handle().clone();

    // Create system tray menu
    let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
    // Only add "update" if not portable
    let menu = if !is_portable() {
        let update = MenuItem::with_id(app, "update", "Check for updates..", true, None::<&str>)?;
        Menu::with_items(app, &[&show, &update, &quit])?
    } else {
        Menu::with_items(app, &[&show, &quit])?
    };

    // Load icon directly from binary resources
    let icon_bytes = include_bytes!("../icons/32x32.png");
    let icon = Image::from_bytes(icon_bytes)?;

    TrayIconBuilder::with_id("1")
        .icon(icon)
        .tooltip("Steam Game Idler")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| match event {
            // Show app window when user left-clicks on the tray icon
            TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } => {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            _ => {}
        })
        .on_menu_event(move |app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            "update" => {
                // Run update check in background to avoid blocking UI
                let app_handle_for_update = app_handle.clone();
                tauri::async_runtime::spawn(async move {
                    match check_for_updates(app_handle_for_update.clone()).await {
                        Ok(_) => println!("Update check complete"),
                        Err(e) => println!("Update check failed: {}", e),
                    }
                });
            }
            "quit" => {
                app.exit(0);
            }
            _ => {
                println!("Menu item {:?} not handled", event.id);
            }
        })
        .build(app)?;

    Ok(())
}

async fn check_for_updates(app_handle: tauri::AppHandle) -> tauri_plugin_updater::Result<()> {
    if let Some(update) = app_handle.updater()?.check().await? {
        update
            .download_and_install(|_downloaded, _total| {}, || {})
            .await?;
        app_handle.restart();
    } else {
        use tauri_plugin_notification::NotificationExt;
        app_handle
            .notification()
            .builder()
            .title("No updates available")
            .show()
            .unwrap();
    }

    Ok(())
}
