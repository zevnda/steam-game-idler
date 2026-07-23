//! Locates the bundled `libs/SteamUtility[.exe]` - two entry points ([`locate`], [`locate_for_agent`])
//! sharing one "append libs/binary-name, confirm it exists" core, differing only in how each
//! resolves the base directory (see each function's own doc comment for why they can't share that
//! part too).

use std::path::PathBuf;
use std::time::Duration;

use serde::de::DeserializeOwned;
use serde::Deserialize;
use tauri::Manager;
use tokio::process::Command;

use crate::error::{AppError, AppResult};

/// Win32 `CREATE_NO_WINDOW` - suppresses the console window that would otherwise flash briefly.
/// No Linux equivalent needed: a spawned child process there has no console window to flash in
/// the first place.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// `SteamworksLocalBackend.cs`/`Client.cs` error codes that mean "the local Steam client process
/// exists but hasn't finished starting up yet" - races commonly hit right after
/// `local_steam::commands::launch_steam`/`switch_steam_account` spawn `steam.exe`, since
/// `is_steam_running` only checks for the process existing, not its IPC pipe being up. Distinct
/// from genuine non-transient failures like `steam_install_not_found`. Retrying here fixes the
/// race for every CLI-mode command through [`run_and_parse`], not just the games list.
const TRANSIENT_STARTUP_ERROR_CODES: &[&str] = &[
    "steam_not_running",
    "steam_pipe_creation_failed",
    "steam_client_creation_failed",
];

const STARTUP_RETRY_INTERVAL: Duration = Duration::from_secs(1);
/// Upper bound on how long to keep retrying a transient startup error before giving up and
/// surfacing it for real - generous because a cold Steam launch (as opposed to one already warm
/// in the background) can legitimately take this long to finish reaching its main UI.
const STARTUP_RETRY_ATTEMPTS: u32 = 20;

/// Appends `libs/SteamUtility[.exe]` to `base_dir` and confirms it actually exists there - the
/// part [`locate`] and [`locate_for_agent`] share, differing only in how each resolves `base_dir`.
fn resolve_steam_utility(mut base_dir: PathBuf) -> AppResult<PathBuf> {
    base_dir.push("libs");
    // The Linux daemon-only publish produces an extension-less binary (see
    // `libs/SteamUtility/SteamUtility.csproj`'s RID-conditioned `RemovePublishExtras` target) -
    // Windows keeps its `.exe` suffix.
    #[cfg(windows)]
    base_dir.push("SteamUtility.exe");
    #[cfg(not(windows))]
    base_dir.push("SteamUtility");
    if !base_dir.exists() {
        return Err(AppError::SteamUtilityExeNotFound(
            base_dir.display().to_string(),
        ));
    }
    Ok(base_dir)
}

/// `current_exe()`-relative lookup - correct for every Windows build (NSIS install and the
/// portable zip both keep `libs/` sitting next to the `.exe`) and for a dev build on every
/// platform (`libs/*` lands next to `target/debug/steam-game-idler` too). Only ever reached by the
/// CLI-mode-only call sites below (`run_once`, in turn only reachable from `local_steam::
/// ownership`/`achievements`), which never run on Linux at all - see [`locate_for_agent`] for the
/// one call site that must resolve correctly on every Linux packaging format too.
pub fn locate() -> AppResult<PathBuf> {
    let mut path = std::env::current_exe().map_err(AppError::ProcessSpawn)?;
    path.pop();
    resolve_steam_utility(path)
}

/// Lookup for the one call site that must work on every platform/packaging format
/// `AgentProcess::spawn` (agent mode's daemon spawn) can run under, including every Linux
/// packaging format - unlike `locate()`'s `current_exe()`-relative assumption, which breaks for
/// `.deb`/`.rpm` (Tauri's bundler doesn't place declared `resources` next to the installed binary
/// there - `/usr/bin/` is meant to hold only executables) and, it turns out, for AppImage too (see
/// below).
///
/// Two strategies, tried in this order:
/// 1. **AppImage** (`APPDIR` env var present - the same one `platform::can_auto_update` keys off
///    of): build the path directly from `APPDIR` + `usr/lib/<package name>`. Deliberately *not*
///    Tauri's own `resource_dir()` here, even though it has matching AppImage-aware fallback logic
///    internally (it also checks `APPDIR`) - that logic didn't resolve correctly in practice, and
///    building the well-known path directly is simpler and reliable.
/// 2. **Everything else** (Windows, Linux `.deb`/`.rpm`): Tauri's `resource_dir()`.
pub fn locate_for_agent(app_handle: &tauri::AppHandle) -> AppResult<PathBuf> {
    #[cfg(not(windows))]
    if let Some(appdir) = std::env::var_os("APPDIR") {
        let mut path = PathBuf::from(appdir);
        path.push("usr");
        path.push("lib");
        path.push(&app_handle.package_info().name);
        return resolve_steam_utility(path);
    }

    let resource_dir = app_handle
        .path()
        .resource_dir()
        .map_err(|e| AppError::PathResolution(e.to_string()))?;
    resolve_steam_utility(resource_dir)
}

#[derive(Debug, Deserialize)]
struct Envelope<T> {
    ok: bool,
    result: Option<T>,
    error: Option<String>,
}

/// Runs a one-shot `SteamUtility.exe <args>` CLI invocation and parses its single stdout JSON
/// envelope line (`Core/Json/JsonEnvelope.cs`'s `{ok, result|error}` shape) into `T`. On `!ok`,
/// surfaces SteamUtility's domain error code verbatim via `AppError::SteamUtility` so callers can
/// distinguish specific codes like `achievement_protected`. Transparently retries
/// [`TRANSIENT_STARTUP_ERROR_CODES`] so a caller doesn't need its own readiness-polling logic.
pub async fn run_and_parse<T: DeserializeOwned>(args: &[&str]) -> AppResult<T> {
    for attempt in 1..=STARTUP_RETRY_ATTEMPTS {
        match run_once(args).await? {
            Ok(value) => return Ok(value),
            Err(code) if TRANSIENT_STARTUP_ERROR_CODES.contains(&code.as_str()) => {
                if attempt == STARTUP_RETRY_ATTEMPTS {
                    return Err(AppError::SteamUtility(code));
                }
                tracing::info!(
                    error_code = %code,
                    attempt,
                    "local Steam client not ready yet, retrying"
                );
                tokio::time::sleep(STARTUP_RETRY_INTERVAL).await;
            }
            Err(code) => return Err(AppError::SteamUtility(code)),
        }
    }
    unreachable!("loop always returns by its final iteration")
}

/// Single `SteamUtility.exe <args>` invocation, without the retry wrapper - `Ok(Err(code))` for a
/// domain-level `{ok: false}` envelope (so [`run_and_parse`] can inspect the code before deciding
/// whether to retry), `Err` for a spawn/parse failure the retry loop doesn't apply to.
async fn run_once<T: DeserializeOwned>(args: &[&str]) -> AppResult<Result<T, String>> {
    let exe_path = locate()?;

    let mut command = Command::new(&exe_path);
    command.args(args);
    #[cfg(windows)]
    command.creation_flags(CREATE_NO_WINDOW);

    let output = command.output().await.map_err(AppError::ProcessSpawn)?;

    for line in String::from_utf8_lossy(&output.stderr).lines() {
        tracing::info!("steam_utility: {line}");
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let line = stdout.lines().next().unwrap_or("").trim();
    if line.is_empty() {
        return Err(AppError::SteamUtility(
            "SteamUtility.exe produced no output".to_string(),
        ));
    }

    let envelope: Envelope<T> = serde_json::from_str(line)
        .map_err(|e| AppError::SteamUtility(format!("failed to parse output: {e}")))?;

    if !envelope.ok {
        return Ok(Err(envelope
            .error
            .unwrap_or_else(|| "unknown_error".to_string())));
    }

    Ok(Ok(envelope
        .result
        .ok_or_else(|| AppError::SteamUtility("empty result".to_string()))?))
}
