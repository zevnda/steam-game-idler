//! The updater plugin is configured in `tauri.conf.json` and driven from the frontend via
//! `@tauri-apps/plugin-updater`'s `check`/`downloadAndInstall` - no custom command wraps that round
//! trip. `tray.rs`'s "Check for updates.." item is the other entry point, driving the plugin
//! directly since there's no React tree to hand a result back to.
//!
//! `kill_all_steam_utility_processes` below exists because an update install can't overwrite
//! `SteamUtility.exe` while a spawned copy still holds it open.

use std::os::windows::process::CommandExt;

use tauri::State;

use crate::error::{AppError, AppResult};
use crate::idling::claims::IdleClaimsRegistry;
use crate::idling::IdlingManager;
use crate::steam_agent::AgentManager;

/// Win32 `CREATE_NO_WINDOW` - suppresses the console window that would otherwise flash briefly for
/// the `taskkill` child process.
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Ends every live `SteamUtility.exe` process so an update install can safely overwrite it. Four
/// passes: `AgentManager` and `IdlingManager` each tear down only the sessions/processes they
/// spawned themselves through their owning manager (so neither keeps a handle to an already-dead
/// process), the image-name pass is a backstop catching anything neither tracks, and the
/// claims-registry pass clears every owner's idle claim so a stale one can't get resurrected by a
/// later `replace_owner_claim` call.
#[tauri::command]
pub async fn kill_all_steam_utility_processes(
    agent_manager: State<'_, AgentManager>,
    idling_manager: State<'_, IdlingManager>,
    claims: State<'_, IdleClaimsRegistry>,
) -> AppResult<()> {
    agent_manager.kill_all().await;
    idling_manager.kill_all().await;
    claims.clear().await;
    let result = kill_by_image_name().await;
    match &result {
        Ok(()) => tracing::info!("updater: killed all SteamUtility.exe processes"),
        Err(e) => tracing::warn!(error = %e, "updater: kill_by_image_name pass failed"),
    }
    result
}

async fn kill_by_image_name() -> AppResult<()> {
    tokio::task::spawn_blocking(|| {
        // A non-zero exit (e.g. "process not found" when nothing is running) isn't an error for
        // this command's purposes - only a failure to run `taskkill` at all is.
        std::process::Command::new("taskkill")
            .args(["/F", "/IM", "SteamUtility.exe", "/T"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map(|_| ())
            .map_err(|e| AppError::ProcessKill(e.to_string()))
    })
    .await
    .map_err(|e| AppError::ProcessKill(e.to_string()))?
}
