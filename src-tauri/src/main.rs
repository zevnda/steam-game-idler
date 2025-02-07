#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod automation;
pub mod game_data;
pub mod logging;
pub mod tasks;
pub mod user_data;
pub mod utils;
use automation::*;
use game_data::*;
use logging::*;
use tasks::*;
use user_data::*;
use utils::*;

use std::env;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};
use window_shadows::set_shadow;

static SHUTTING_DOWN: AtomicBool = AtomicBool::new(false);

fn main() {
    // Load environment variables based on the build configuration
    if cfg!(debug_assertions) {
        dotenv::from_filename(".env.dev").unwrap().load();
    } else {
        let prod_env = include_str!("../../.env.prod");
        let result = dotenv::from_read(prod_env.as_bytes()).unwrap();
        result.load();
    }

    // Create system tray menu items
    let show = CustomMenuItem::new("show".to_string(), "Show");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit Steam Game Idler");
    let tray_menu = SystemTrayMenu::new().add_item(show).add_item(quit);
    let system_tray = SystemTray::new()
        .with_tooltip("Steam Game Idler")
        .with_menu(tray_menu);

    // Create a channel for communication between threads
    let (tx, rx) = mpsc::channel();

    tauri::Builder::default()
        .setup(move |app| {
            // Get the main window and set shadow
            let window = app.get_window("main").unwrap();
            set_shadow(&window, true).unwrap();
            let spawned_processes = SPAWNED_PROCESSES.clone();
            let tx_clone = tx.clone();
            let app_handle = app.handle();

            // Spawn a thread to monitor the shutdown flag
            std::thread::spawn(move || loop {
                if SHUTTING_DOWN.load(Ordering::SeqCst) {
                    kill_processes(&spawned_processes);
                    app_handle.save_window_state(StateFlags::all()).unwrap();
                    tx_clone.send(()).unwrap();
                    break;
                }
                thread::sleep(Duration::from_millis(100));
            });

            // Handle window close event
            let app_handle_clone = app.handle();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    app_handle_clone
                        .save_window_state(StateFlags::all())
                        .unwrap();
                    SHUTTING_DOWN.store(true, Ordering::SeqCst);
                }
            });

            Ok(())
        })
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            // Handle system tray left click event
            SystemTrayEvent::LeftClick { .. } => {
                let window = app.get_window("main").unwrap();
                window.show().unwrap();
                window.set_focus().unwrap();
            }

            // Handle system tray menu item click events
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    app.save_window_state(StateFlags::all()).unwrap();
                    SHUTTING_DOWN.store(true, Ordering::SeqCst);
                    let window = app.get_window("main").unwrap();
                    app.save_window_state(StateFlags::all()).unwrap();
                    window.close().unwrap();
                    thread::sleep(Duration::from_millis(1000));
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        // Register commands
        .invoke_handler(tauri::generate_handler![
            check_status,
            get_users,
            start_idle,
            stop_idle,
            unlock_achievement,
            lock_achievement,
            toggle_achievement,
            unlock_all_achievements,
            lock_all_achievements,
            update_stats,
            reset_all_stats,
            log_event,
            clear_log_file,
            get_app_log_dir,
            get_user_summary,
            get_games_list,
            get_recent_games,
            get_games_list_cache,
            delete_games_list_files,
            get_game_details,
            get_achievement_data,
            validate_session,
            get_drops_remaining,
            get_games_with_drops,
            open_file_explorer,
            get_free_games,
            anti_away,
            check_process_by_game_id,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        // Handle tray menu events
        .run(move |app_handle, event| match event {
            tauri::RunEvent::ExitRequested { api, .. } => {
                api.prevent_exit();
                app_handle.save_window_state(StateFlags::all()).unwrap();
            }
            tauri::RunEvent::Exit => {
                SHUTTING_DOWN.store(true, Ordering::SeqCst);
                app_handle.save_window_state(StateFlags::all()).unwrap();
                rx.recv().unwrap();
                thread::sleep(Duration::from_secs(2));
            }
            _ => {}
        });
}
