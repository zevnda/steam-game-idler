use tauri::{Listener, Manager};
use tauri_plugin_window_state::StateFlags;

mod achievement_unlocker;
mod achievements;
mod async_utils;
mod auto_idle;
mod card_farming;
mod credential_store;
mod customization;
mod debug;
mod embedded_api_key;
mod error;
mod favorites;
mod free_games;
mod fs_utils;
mod games;
mod idling;
mod inventory;
mod legacy_migration;
mod local_steam;
mod logging;
mod max_playtime;
mod platform;
mod settings;
mod steam_agent;
mod steam_community;
mod steam_utility_exe;
mod steam_web_api;
mod subscription;
mod tray;
mod updater;
mod zoom;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Must be registered first so it can intercept startup before any other plugin/setup
        // runs on a second launch attempt (Tauri's own recommendation for this plugin).
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            tracing::info!(
                "single-instance: second launch attempt intercepted, focusing existing window"
            );
            if let Some(window) = app.get_webview_window("main") {
                if let Err(e) = window.show() {
                    tracing::warn!(error = %e, "single-instance: failed to show main window");
                }
                if let Err(e) = window.set_focus() {
                    tracing::warn!(error = %e, "single-instance: failed to focus main window");
                }
            }
        }))
        .plugin({
            let mut builder = tauri_plugin_window_state::Builder::new().with_state_flags(
                StateFlags::SIZE
                    | StateFlags::POSITION
                    | StateFlags::MAXIMIZED
                    | StateFlags::DECORATIONS
                    | StateFlags::FULLSCREEN,
            );

            // Portable builds store window position/size next to the binary instead of AppData,
            // matching the rest of the app's portable-mode file placement (see `platform::cache_dir`).
            if platform::is_portable() {
                builder = builder.with_dir("./");
            }

            builder.build()
        })
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(steam_agent::AgentManager::new())
        .manage(idling::IdlingManager::new())
        .manage(idling::claims::IdleClaimsRegistry::new())
        .manage(idling::auto_stop::IdleAutoStopRegistry::new())
        .manage(card_farming::CardFarmingManager::new())
        .manage(achievement_unlocker::AchievementUnlockerManager::new())
        .manage(local_steam::commands::SteamStatusMonitor::new())
        .setup(|app| {
            let log_guard = logging::init(app.handle())?;
            app.manage(log_guard);
            logging::purge_old_logs(app.handle());
            // Must run before the webview loads (see legacy_migration's doc comment) - before
            // setup_window/tray so nothing else touches the cache directory first.
            let migrated = legacy_migration::run(app.handle());
            app.manage(legacy_migration::LegacyMigrationState(migrated));
            setup_window(app.handle())?;
            tray::setup(app.handle())?;
            tauri::async_runtime::spawn(max_playtime::enforcement::run(app.handle().clone()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            steam_agent::commands::agent_login,
            steam_agent::commands::agent_begin_qr_login,
            steam_agent::commands::agent_cancel_qr_login,
            steam_agent::commands::agent_submit_guard_code,
            steam_agent::commands::agent_login_with_token,
            steam_agent::commands::agent_logout,
            steam_agent::commands::agent_get_presence_settings,
            steam_agent::commands::agent_set_presence_settings,
            platform::is_portable,
            platform::is_dev,
            updater::kill_all_steam_utility_processes,
            local_steam::commands::get_users,
            local_steam::commands::get_user_summary,
            local_steam::commands::get_user_summary_cache,
            local_steam::commands::delete_user_summary_file,
            local_steam::commands::is_steam_running,
            local_steam::commands::start_steam_status_monitor,
            local_steam::commands::anti_away,
            local_steam::commands::launch_steam,
            local_steam::commands::prepare_steam_account_switch,
            local_steam::commands::switch_steam_account,
            games::commands::get_owned_games,
            games::commands::get_owned_games_cache,
            games::commands::delete_owned_games_cache,
            games::commands::resolve_account_steam_id,
            idling::commands::get_idle_state,
            idling::commands::toggle_manual_idle,
            idling::commands::stop_all_idling,
            idling::commands::get_idle_claims,
            idling::commands::stop_owner_idling,
            idling::commands::get_idling_global_max_idle_time,
            idling::commands::set_idling_global_max_idle_time,
            idling::commands::get_idling_max_idle_time,
            idling::commands::set_idling_max_idle_time,
            idling::commands::get_idling_customized_app_ids,
            max_playtime::commands::get_global_max_playtime,
            max_playtime::commands::set_global_max_playtime,
            max_playtime::commands::get_max_playtime,
            max_playtime::commands::set_max_playtime,
            max_playtime::commands::get_max_playtime_customized_app_ids,
            favorites::commands::get_favorites,
            favorites::commands::add_favorite,
            favorites::commands::remove_favorite,
            favorites::commands::set_favorites_order,
            auto_idle::commands::get_auto_idle_list,
            auto_idle::commands::add_to_auto_idle_list,
            auto_idle::commands::remove_from_auto_idle_list,
            auto_idle::commands::set_auto_idle_list_order,
            auto_idle::commands::set_auto_idle_enabled,
            auto_idle::commands::start_auto_idle_games,
            free_games::commands::get_free_games,
            free_games::commands::claim_free_game,
            free_games::commands::get_free_games_settings,
            free_games::commands::set_free_games_settings,
            free_games::commands::ensure_free_games_store_session,
            free_games::commands::clear_free_games_store_session,
            settings::commands::get_settings,
            settings::commands::validate_steam_web_api_key,
            settings::commands::set_steam_web_api_key,
            settings::commands::set_anti_away,
            settings::commands::set_start_minimized,
            settings::commands::set_close_to_tray,
            settings::commands::set_auto_update_games_list,
            settings::commands::set_free_game_notifications,
            settings::commands::set_theme,
            settings::commands::set_font,
            settings::commands::set_disable_tooltips,
            settings::commands::set_show_recommended_carousel,
            settings::commands::set_show_recent_carousel,
            customization::commands::set_custom_background,
            customization::commands::clear_custom_background,
            customization::commands::get_custom_background_data_url,
            achievements::commands::get_achievement_data,
            achievements::commands::set_achievement,
            achievements::commands::unlock_all_achievements,
            achievements::commands::lock_all_achievements,
            achievements::commands::update_stats,
            achievements::commands::reset_all_stats,
            subscription::get_device_fingerprint,
            subscription::quit_app,
            card_farming::commands::get_drops_remaining,
            card_farming::commands::get_games_with_drops,
            card_farming::commands::start_farming,
            card_farming::commands::stop_farming,
            card_farming::commands::get_farming_state,
            card_farming::commands::get_card_farming_settings,
            card_farming::commands::set_card_farming_settings,
            card_farming::commands::get_card_farming_global_max_farming_time,
            card_farming::commands::set_card_farming_global_max_farming_time,
            card_farming::commands::get_card_farming_max_card_drops,
            card_farming::commands::set_card_farming_max_card_drops,
            card_farming::commands::get_card_farming_max_card_farming_time,
            card_farming::commands::set_card_farming_max_card_farming_time,
            card_farming::commands::get_card_farming_customized_app_ids,
            card_farming::commands::get_card_farming_queue,
            card_farming::commands::add_to_card_farming_queue,
            card_farming::commands::remove_from_card_farming_queue,
            card_farming::commands::set_card_farming_queue_order,
            card_farming::commands::get_card_farming_blacklist,
            card_farming::commands::add_to_card_farming_blacklist,
            card_farming::commands::remove_from_card_farming_blacklist,
            card_farming::commands::clear_card_farming_blacklist,
            achievement_unlocker::commands::get_achievement_unlocker_queue,
            achievement_unlocker::commands::add_to_achievement_unlocker_queue,
            achievement_unlocker::commands::remove_from_achievement_unlocker_queue,
            achievement_unlocker::commands::set_achievement_unlocker_queue_order,
            achievement_unlocker::commands::get_achievement_unlocker_settings,
            achievement_unlocker::commands::set_achievement_unlocker_settings,
            achievement_unlocker::commands::get_achievement_unlocker_max_unlocks,
            achievement_unlocker::commands::set_achievement_unlocker_max_unlocks,
            achievement_unlocker::commands::get_achievement_unlocker_customized_app_ids,
            achievement_unlocker::commands::get_achievement_order,
            achievement_unlocker::commands::save_achievement_order,
            achievement_unlocker::commands::import_achievement_timings,
            achievement_unlocker::commands::start_achievement_unlocker,
            achievement_unlocker::commands::update_achievement_unlocker_concurrency,
            achievement_unlocker::commands::stop_achievement_unlocker,
            achievement_unlocker::commands::get_achievement_unlocker_state,
            inventory::commands::get_inventory,
            inventory::commands::get_inventory_cache,
            inventory::commands::delete_inventory_cache,
            inventory::commands::get_item_price,
            inventory::commands::list_items,
            inventory::commands::update_item_price_data,
            inventory::commands::remove_market_listings,
            inventory::commands::get_inventory_settings,
            inventory::commands::set_inventory_settings,
            steam_community::commands::get_steam_credentials,
            steam_community::commands::set_steam_credentials,
            steam_community::commands::validate_and_save_steam_credentials,
            steam_community::commands::clear_steam_credentials,
            steam_community::commands::acquire_and_save_steam_credentials,
            debug::commands::get_log_file_path,
            debug::commands::get_settings_file_path,
            debug::commands::get_log_lines,
            debug::commands::clear_log_file,
            debug::commands::clear_all_cache_files,
            debug::commands::get_system_info,
            debug::commands::reset_settings,
            legacy_migration::was_legacy_migration_performed,
            logging::log_frontend_event,
            zoom::set_zoom,
            tray::update_tray_menu,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            // Without this, quitting the app (tray Quit, titlebar close with close-to-tray off, or
            // a forced quit on subscription revocation) leaves CLI-mode `SteamUtility.exe idle`
            // children and agent-mode daemon sessions running as orphans: `AppHandle::exit` tears
            // down the process via `std::process::exit`, which runs no destructors, so the tracked
            // `Child`'s `kill_on_drop` never fires. Reuses the same cleanup already wired into the
            // pre-update-install and sign-out paths (`updater::kill_all_steam_utility_processes`)
            // rather than a separate exit-only kill list, and blocks the exit on it completing -
            // mirrors `main`'s `RunEvent::Exit => kill_tracked_processes_blocking()`.
            if let tauri::RunEvent::Exit = event {
                tauri::async_runtime::block_on(async {
                    if let Err(err) = updater::kill_all_steam_utility_processes(
                        app_handle.state(),
                        app_handle.state(),
                        app_handle.state(),
                    )
                    .await
                    {
                        tracing::warn!(?err, "exit: failed to kill SteamUtility.exe processes");
                    }
                });
            }
        });
}

/// The window starts hidden (`tauri.conf.json`'s `visible`/`focus` are both `false`) so the
/// frontend's blank-then-painted webview never flashes as a visible window. It's shown only once
/// the frontend emits `ready` after its first real paint - unless `Settings::start_minimized` is
/// set, in which case it's deliberately left hidden (not OS-taskbar-minimized, matching `main`'s
/// real semantics - see that field's own doc comment) and only recoverable via the tray's "Show".
/// Falls back to showing if settings fail to load, same as `main`'s own error-fallback behavior.
fn setup_window(app_handle: &tauri::AppHandle) -> tauri::Result<()> {
    let window = app_handle
        .get_webview_window("main")
        .expect("main window must exist at setup time");

    let window_for_ready = window.clone();
    let app_handle_for_ready = app_handle.clone();
    window.once("ready", move |_| {
        let should_start_minimized = settings::load(&app_handle_for_ready)
            .map(|settings| settings.start_minimized)
            .unwrap_or(false);

        if !should_start_minimized {
            let _ = window_for_ready.show();
            let _ = window_for_ready.set_focus();
        }
    });

    Ok(())
}
