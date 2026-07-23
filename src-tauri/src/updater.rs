//! The updater plugin is configured in `tauri.conf.json` and driven from the frontend via
//! `@tauri-apps/plugin-updater`'s `check`/`downloadAndInstall` - no custom command wraps that round
//! trip. `tray.rs`'s "Check for updates.." item is the other entry point, driving the plugin
//! directly since there's no React tree to hand a result back to.
//!
//! `kill_all_steam_utility_processes` below exists because an update install can't overwrite the
//! SteamUtility binary while a spawned copy still holds it open.

use std::ffi::OsStr;

use tauri::State;

use crate::error::AppResult;
use crate::idling::claims::IdleClaimsRegistry;
use crate::idling::IdlingManager;
use crate::steam_agent::AgentManager;

/// Substring (not exact) match so one implementation covers both platforms' publish output names
/// - `SteamUtility.exe` on Windows, the extension-less `SteamUtility` on Linux (see
/// `steam_utility_exe::locate`'s doc comment for why they differ).
const PROCESS_NAME_PATTERN: &str = "SteamUtility";

/// Ends every live SteamUtility process so an update install can safely overwrite it. Four
/// passes: `AgentManager` and `IdlingManager` each tear down only the sessions/processes they
/// spawned themselves through their owning manager (so neither keeps a handle to an already-dead
/// process), the process-name pass is a backstop catching anything neither tracks, and the
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
    let killed = kill_by_process_name().await;
    tracing::info!(killed, "updater: killed all SteamUtility processes");
    Ok(())
}

/// One cross-platform implementation via `sysinfo` rather than a Windows `taskkill` shell-out
/// paired with a separate Linux `pkill`/signal path - `sysinfo::Process::kill` already sends
/// `TerminateProcess`/`SIGKILL` under the hood per platform. Returns the number of processes
/// killed purely for the log line above; finding zero (nothing was running) is the common case,
/// not an error.
async fn kill_by_process_name() -> usize {
    let result = tokio::task::spawn_blocking(|| {
        let system = sysinfo::System::new_all();
        system
            .processes_by_name(OsStr::new(PROCESS_NAME_PATTERN))
            .filter(|process| process.kill())
            .count()
    })
    .await;

    match result {
        Ok(count) => count,
        Err(e) => {
            tracing::warn!(error = %e, "updater: process-name kill pass panicked");
            0
        }
    }
}
