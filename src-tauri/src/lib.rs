#[cfg_attr(mobile, tauri::mobile_entry_point)]
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
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::Duration;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Listener, Manager};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_window_state::StateFlags;

// TODO: Delete once all users are migrated to the new format
use std::fs::remove_dir_all;

static SHUTTING_DOWN: AtomicBool = AtomicBool::new(false);

pub fn run() {
    // Load environment variables based on the build configuration
    if cfg!(debug_assertions) {
        dotenv::from_filename(".env.dev").unwrap().load();
    } else {
        let prod_env = include_str!("../../.env.prod");
        let result = dotenv::from_read(prod_env.as_bytes()).unwrap();
        result.load();
    }

    // Create a channel for communication between threads
    let (tx, rx) = mpsc::channel();

    tauri::Builder::default()
        .plugin(
            tauri_plugin_window_state::Builder::new()
                .with_state_flags(
                    StateFlags::SIZE
                        | StateFlags::POSITION
                        | StateFlags::MAXIMIZED
                        | StateFlags::DECORATIONS
                        | StateFlags::FULLSCREEN,
                )
                .build(),
        )
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .setup(move |app| setup_app(app, tx.clone()))
        .invoke_handler(tauri::generate_handler![
            check_status,
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
            get_app_log_dir,
            get_user_summary,
            get_games_list,
            get_recent_games,
            get_games_list_cache,
            delete_user_games_list_files,
            delete_all_games_list_files,
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
        .run(move |_, event| match event {
            tauri::RunEvent::Exit => {
                SHUTTING_DOWN.store(true, Ordering::SeqCst);
                rx.recv().unwrap();
                thread::sleep(Duration::from_secs(2));
            }
            _ => {}
        });
}

fn setup_app(app: &mut tauri::App, tx: mpsc::Sender<()>) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.handle();
    setup_window(&app_handle)?;
    migrate_old_data(&app_handle)?;
    setup_tray_icon(app)?;
    setup_process_monitor(tx, SPAWNED_PROCESSES.clone());

    Ok(())
}

fn setup_window(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let window = app_handle.get_webview_window("main").unwrap();

    // Listen for ready event from frontend
    let window_clone = window.clone();
    window.listen("ready", move |_| {
        window_clone.show().unwrap();
        window_clone.set_focus().unwrap();
    });

    Ok(())
}

// TODO: Delete once all users are migrated to the new format
fn migrate_old_data(app_handle: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Delete the old app-specific directory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let app_specific_dir = app_data_dir
        .parent()
        .unwrap_or(&app_data_dir)
        .join("steam-game-idler");
    match remove_dir_all(&app_specific_dir) {
        Ok(_) => println!("Successfully deleted directory: {:?}", app_specific_dir),
        Err(e) => println!(
            "Failed to delete directory: {:?}, Error: {}",
            app_specific_dir, e
        ),
    }

    Ok(())
}

fn setup_tray_icon(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Steam Game Idler", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .tooltip("Steam Game Idler")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| match event {
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
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            _ => {
                println!("menu item {:?} not handled", event.id);
            }
        })
        .build(app)?;

    Ok(())
}

fn setup_process_monitor(tx: mpsc::Sender<()>, spawned_processes: Arc<Mutex<Vec<ProcessInfo>>>) {
    // Spawn a thread to monitor the shutdown flag
    std::thread::spawn(move || loop {
        if SHUTTING_DOWN.load(Ordering::SeqCst) {
            kill_processes(&spawned_processes);
            tx.send(()).unwrap();
            break;
        }
        thread::sleep(Duration::from_millis(100));
    });
}
