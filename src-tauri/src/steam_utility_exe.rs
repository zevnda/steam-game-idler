//! Locates the bundled `libs/SteamUtility.exe`, next to the app's own executable - shared by both
//! the persistent agent-mode process (`steam_agent::process::AgentProcess::spawn`) and one-shot
//! CLI-mode invocations (`local_steam::ownership`, `local_steam::achievements`), so there's exactly
//! one place that knows the relative path convention.

use std::path::PathBuf;
use std::time::Duration;

use serde::de::DeserializeOwned;
use serde::Deserialize;
use tokio::process::Command;

use crate::error::{AppError, AppResult};

/// Win32 `CREATE_NO_WINDOW` - suppresses the console window that would otherwise flash briefly.
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

pub fn locate() -> AppResult<PathBuf> {
    let mut path = std::env::current_exe().map_err(AppError::ProcessSpawn)?;
    path.pop();
    path.push("libs");
    path.push("SteamUtility.exe");
    if !path.exists() {
        return Err(AppError::SteamUtilityExeNotFound(
            path.display().to_string(),
        ));
    }
    Ok(path)
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

    let output = Command::new(&exe_path)
        .args(args)
        .creation_flags(CREATE_NO_WINDOW)
        .output()
        .await
        .map_err(AppError::ProcessSpawn)?;

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
