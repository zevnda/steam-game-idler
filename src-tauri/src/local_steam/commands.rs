//! Tauri commands for CLI-mode ("local Steam client") sign-in and account switching. Ported from
//! `main`'s `user_data.rs`/`utils.rs` with typed `AppError`s in place of `Result<T, String>`, and
//! structured logging in place of silence. One deliberate
//! behavior change: [`switch_steam_account`] now surfaces a failure to relaunch Steam after
//! killing it, instead of swallowing it like `main` does - silently leaving the user with Steam
//! dead and no error shown would be worse than the original failure ever was.

use std::fs;
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use serde_json::Value;
use sysinfo::{ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter, State};

use crate::error::{AppError, AppResult};

use super::vdf::{self, LocalSteamUser};
use super::{locate_steam, login_users_vdf_path, steam_web_api};

/// Win32 `CREATE_NO_WINDOW` - suppresses the console window that would otherwise flash briefly for
/// the `steam.exe`/`reg`/`taskkill` child processes this module spawns. This whole file is
/// CLI-mode-only and thus Windows-only in practice (no local Steam client concept on Linux - see
/// `local_steam` module doc), but it must still compile on Linux (never exercised there - no
/// CLI-mode sign-in option in the Linux frontend), so each Windows-only call site below gets a
/// plain `cfg(windows)` split rather than excluding this file from the Linux build outright -
/// several sibling modules in `local_steam` (e.g. `free_game_claim`) are genuinely shared with
/// agent mode and must keep compiling for Linux regardless.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// Lists every account that has signed into the local Steam client at least once, parsed from
/// `<steam>/config/loginusers.vdf`. An empty list is a legitimate result (Steam installed but
/// never signed into) - only a missing/unreadable Steam install is an error.
#[tauri::command]
pub fn get_users() -> AppResult<Vec<LocalSteamUser>> {
    let path = login_users_vdf_path()?;
    let users = vdf::parse_login_users(&path)?;
    tracing::info!(count = users.len(), "parsed local Steam accounts");
    Ok(users)
}

/// Fetches persona name/avatar for `steam_id` (or a comma-delimited list) from the Steam Web API,
/// caching successful results to `user_summaries.json` so they remain available offline. The
/// Steam Web API key override (if any) is read from the OS credential store internally - see
/// `steam_web_api::resolve_api_key` for the fallback behavior when there isn't one.
#[tauri::command]
pub async fn get_user_summary(steam_id: String, app_handle: AppHandle) -> AppResult<Value> {
    let api_key = crate::credential_store::load_web_api_key()?;
    steam_web_api::get_user_summary(&app_handle, &steam_id, api_key).await
}

#[tauri::command]
pub fn get_user_summary_cache(app_handle: AppHandle) -> AppResult<Value> {
    steam_web_api::read_cache(&app_handle)
}

#[tauri::command]
pub fn delete_user_summary_file(app_handle: AppHandle) -> AppResult<()> {
    steam_web_api::delete_cache(&app_handle)
}

/// Whether `steam.exe` currently has a running process - CLI-mode features that need a live local
/// Steam client (unlike agent mode) gate on this.
#[tauri::command]
pub fn is_steam_running() -> bool {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    sys.processes()
        .values()
        .any(|proc| proc.name().eq_ignore_ascii_case("steam.exe"))
}

/// Pre-flight gate for CLI-mode command entry points: rejects upfront, before any real work starts,
/// instead of letting the work fail deep inside a spawn/loop. Reuses the same `steam_not_running`
/// code SteamUtility.exe's own JSON envelope already reports (`SteamNotRunningException` in
/// `libs/SteamUtility/Core/Errors/SteamUtilityExceptions.cs`), via the generic `AppError::SteamUtility`
/// passthrough variant, so both failure paths collapse into one error identity on the frontend.
pub fn require_steam_running() -> AppResult<()> {
    if is_steam_running() {
        Ok(())
    } else {
        tracing::warn!("Steam client not running, rejecting CLI-mode request");
        Err(AppError::SteamUtility("steam_not_running".to_string()))
    }
}

/// Tauri event emitted whenever [`SteamStatusMonitor`] observes `steam.exe`'s running state
/// change. Payload: `{ "isRunning": bool }`. Drives the frontend's SteamWarning modal - see
/// `main`'s equivalent (`utils.rs::start_steam_status_monitor`, event `steam_status_changed`).
pub const STEAM_STATUS_EVENT: &str = "steam-status-changed";

const STEAM_STATUS_POLL_INTERVAL: Duration = Duration::from_secs(1);

/// Background poller for `steam.exe`'s running state. Only meaningful for CLI mode - agent mode has
/// no dependency on a local Steam client - so the frontend only starts this once a CLI-mode account
/// is signed in (see `useSteamMonitor.ts`), rather than unconditionally at app startup like `main`
/// did. `started` makes [`Self::ensure_started`] idempotent, the same guard `IdlingManager`'s own
/// background poller uses, since the frontend may call the driving command from more than one
/// mount (e.g. switching between accounts).
pub struct SteamStatusMonitor {
    started: AtomicBool,
}

impl SteamStatusMonitor {
    pub fn new() -> Self {
        Self {
            started: AtomicBool::new(false),
        }
    }

    /// Uses `tauri::async_runtime::spawn`, not a bare `tokio::spawn` - this is called from
    /// [`start_steam_status_monitor`], a plain (non-`async`) command, which Tauri dispatches on its
    /// blocking-pool thread rather than an async task, so there's no ambient Tokio runtime context
    /// for `tokio::spawn` to find (`Handle::current()` panics with "there is no reactor running").
    /// `tauri::async_runtime::spawn` explicitly enters the app's stored runtime handle first,
    /// working from any calling thread - confirmed live: a bare `tokio::spawn` here crashed the
    /// whole app on first launch with a CLI-mode account signed in (`STATUS_STACK_BUFFER_OVERRUN`,
    /// a non-unwinding panic inside the WebView2 event loop).
    pub fn ensure_started(&self, app_handle: AppHandle) {
        if self
            .started
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
        {
            tauri::async_runtime::spawn(run_status_poller(app_handle));
        }
    }
}

async fn run_status_poller(app_handle: AppHandle) {
    let mut last_status: Option<bool> = None;
    loop {
        let current_status = is_steam_running();
        if last_status != Some(current_status) {
            last_status = Some(current_status);
            let _ = app_handle.emit(
                STEAM_STATUS_EVENT,
                serde_json::json!({ "isRunning": current_status }),
            );
        }
        tokio::time::sleep(STEAM_STATUS_POLL_INTERVAL).await;
    }
}

/// Starts the background `steam.exe` status poll if it isn't already running - safe to call
/// repeatedly (e.g. once per `useSteamMonitor` mount).
#[tauri::command]
pub fn start_steam_status_monitor(app_handle: AppHandle, monitor: State<'_, SteamStatusMonitor>) {
    monitor.ensure_started(app_handle);
}

/// Nudges the local Steam client's online status via its `steam://` protocol handler - the entire
/// mechanism behind the "Always Online" anti-away setting (`settings::Settings::anti_away`). No
/// input simulation: this just re-announces online status, the same proof-of-life poke `main`'s
/// `anti_away` did. Harmlessly no-ops if no local Steam client is running to handle the URI - the
/// frontend interval driving this is expected to gate on [`is_steam_running`] itself, but this
/// command doesn't re-check that, since spawning `cmd /C start` for a URI scheme nobody's
/// listening on is cheap and not worth a race against Steam closing between the check and the
/// spawn.
#[tauri::command]
pub fn anti_away() -> AppResult<()> {
    let mut command = std::process::Command::new("cmd");
    command.args(["/C", "start", "", "steam://friends/status/online"]);
    #[cfg(windows)]
    command.creation_flags(CREATE_NO_WINDOW);

    command
        .spawn()
        .map(|_| ())
        .map_err(|e| AppError::LocalProcessSpawn(e.to_string()))
}

/// Launches the local Steam client without touching any already-running instance.
#[tauri::command]
pub fn launch_steam() -> AppResult<()> {
    let steam_exe = locate_steam()?.path().join("steam.exe");
    let result = spawn_detached(&steam_exe);
    match &result {
        Ok(()) => tracing::info!("launched local Steam client"),
        Err(e) => tracing::warn!(error = %e, "failed to launch local Steam client"),
    }
    result
}

/// Rewrites `loginusers.vdf` and the `AutoLoginUser` registry value so the local Steam client will
/// sign into `steam_id` on its next launch. Does not itself restart Steam - pair with
/// [`switch_steam_account`] to actually apply it.
#[tauri::command]
pub fn prepare_steam_account_switch(steam_id: String) -> AppResult<()> {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("system clock is before the UNIX epoch")
        .as_secs();

    let vdf_path = login_users_vdf_path()?;
    let content = fs::read_to_string(&vdf_path).map_err(|e| AppError::LoginVdfIo(e.to_string()))?;
    let (updated_content, account_name) =
        vdf::update_login_users_vdf(&content, &steam_id, timestamp)?;
    fs::write(&vdf_path, updated_content).map_err(|e| AppError::LoginVdfIo(e.to_string()))?;

    let mut reg_command = std::process::Command::new("reg");
    reg_command.args([
        "add",
        r"HKCU\Software\Valve\Steam",
        "/v",
        "AutoLoginUser",
        "/t",
        "REG_SZ",
        "/d",
        &account_name,
        "/f",
    ]);
    #[cfg(windows)]
    reg_command.creation_flags(CREATE_NO_WINDOW);

    reg_command
        .output()
        .map_err(|e| AppError::RegistryUpdate(e.to_string()))?;

    tracing::info!(
        steam_id,
        account_name,
        "prepared local Steam account switch"
    );
    Ok(())
}

/// How often [`wait_for_steam_exit`] re-checks whether `steam.exe` has actually terminated.
const KILL_POLL_INTERVAL: Duration = Duration::from_millis(100);
/// Upper bound on how long [`wait_for_steam_exit`] will wait before giving up and relaunching
/// anyway - covers a `taskkill` that silently no-oped (e.g. Steam wasn't actually running), which
/// would otherwise never observe `is_steam_running()` turn false.
const KILL_POLL_TIMEOUT: Duration = Duration::from_secs(5);

/// Kills the local Steam client and relaunches it so a prior [`prepare_steam_account_switch`]
/// takes effect.
#[tauri::command]
pub async fn switch_steam_account() -> AppResult<()> {
    // A non-zero exit (e.g. Steam wasn't running) isn't an error for this command's purposes.
    let mut taskkill_command = std::process::Command::new("taskkill");
    taskkill_command.args(["/F", "/IM", "steam.exe"]);
    #[cfg(windows)]
    taskkill_command.creation_flags(CREATE_NO_WINDOW);

    let _ = taskkill_command.output();

    wait_for_steam_exit(KILL_POLL_TIMEOUT).await;

    let steam_exe = locate_steam()?.path().join("steam.exe");
    let result = spawn_detached(&steam_exe);
    match &result {
        Ok(()) => tracing::info!("switched local Steam account - client relaunched"),
        Err(e) => tracing::warn!(error = %e, "failed to relaunch local Steam client after account switch"),
    }
    result
}

/// Polls for `steam.exe` to actually exit after `taskkill /F`, instead of blindly sleeping a fixed
/// duration - process teardown after a forced kill isn't instantaneous, and a flat sleep can either
/// race a slow/loaded machine (relaunching into a client that's still mid-teardown) or waste time
/// unnecessarily on a fast one. Gives up after `timeout` regardless (see [`KILL_POLL_TIMEOUT`]).
async fn wait_for_steam_exit(timeout: Duration) {
    let deadline = std::time::Instant::now() + timeout;
    while std::time::Instant::now() < deadline {
        if !is_steam_running() {
            return;
        }
        tokio::time::sleep(KILL_POLL_INTERVAL).await;
    }
}

fn spawn_detached(exe: &Path) -> AppResult<()> {
    let mut command = std::process::Command::new(exe);
    #[cfg(windows)]
    command.creation_flags(CREATE_NO_WINDOW);

    command
        .spawn()
        .map(|_| ())
        .map_err(|e| AppError::LocalProcessSpawn(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Not run by default (`cargo test -- --ignored` to opt in): asserts against whatever Steam
    /// process state actually exists on the machine running the test, so it only means something
    /// when Steam is known to be running/not running at the time.
    #[test]
    #[ignore = "depends on real Steam process state on the machine running the test"]
    fn detects_a_real_running_steam_client() {
        assert!(
            is_steam_running(),
            "expected steam.exe to be running - start Steam before running this test"
        );
    }

    /// Not gated behind `--ignored` like the test above - `cmd /C start` succeeds at spawning
    /// regardless of whether a local Steam client is actually running to handle the URI (`start`
    /// hands off to the shell and returns immediately, it doesn't wait for or report on whether
    /// anything claimed the URI scheme), so this is a real assertion on every machine/CI run, not
    /// state-dependent like `detects_a_real_running_steam_client` above.
    #[test]
    fn anti_away_spawns_without_error() {
        assert!(anti_away().is_ok());
    }
}
