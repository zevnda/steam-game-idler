//! Locates the bundled `libs/SteamUtility[.exe]` - two entry points ([`locate`], [`locate_for_agent`])
//! sharing one "append libs/binary-name, confirm it exists" core, differing only in how each
//! resolves the base directory (see each function's own doc comment for why they can't share that
//! part too).

use std::path::PathBuf;
use std::time::Duration;

use serde::de::DeserializeOwned;
use serde::Deserialize;
use tauri::Manager;
use tokio::io::{AsyncBufReadExt, AsyncRead, BufReader};
use tokio::process::{ChildStderr, Command};

use crate::error::{AppError, AppResult};

/// Win32 `CREATE_NO_WINDOW` - suppresses the console window that would otherwise flash briefly.
/// No Linux equivalent needed: a spawned child process there has no console window to flash in
/// the first place.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

/// SteamUtility error codes that mean "the local Steam client process exists but hasn't finished
/// starting up yet" - races commonly hit right after `local_steam::commands::launch_steam`/
/// `switch_steam_account` spawn `steam.exe` (or Steam and this app autostarting together at
/// sign-in), since `is_steam_running` only checks for the process existing, not for Steam being
/// usable. Measured on a real cold start (2026-11): `steam_not_running` for the first ~4s,
/// then `steam_not_ready` (signed in, licenses not loaded) for another ~4s. `steam_not_ready`
/// is also what a Steam left at its sign-in screen reports for good - the two are identical to
/// SteamUtility - so it's retried like a startup race and only surfaces once that runs out.
/// Distinct from genuine non-transient failures like `steam_install_not_found`.
const TRANSIENT_STARTUP_ERROR_CODES: &[&str] = &[
    "steam_not_running",
    "steam_not_ready",
    "steam_pipe_creation_failed",
    "steam_client_creation_failed",
];

/// Owned game that Steam still wouldn't start (see `SteamworksInit.cs`). Retried briefly, not
/// for the full startup budget: right after Steam loads an account's licenses, an owned game
/// fails this way for about half a second, but the other cause - a Steam Families lock while the
/// owner plays - lasts as long as they keep playing, so waiting the full 20s helps nobody.
const GAME_UNAVAILABLE_ERROR_CODE: &str = "steam_game_unavailable";

/// Codes that mean the local Steam client as a whole can't serve any game right now - not one
/// game's problem. A batch caller (several games to idle or scan) stops at the first one rather
/// than paying the full retry budget again for every remaining game.
const STEAM_UNAVAILABLE_ERROR_CODES: &[&str] = &[
    "steam_not_running",
    "steam_not_ready",
    "steam_client_outdated",
    "steam_pipe_creation_failed",
    "steam_client_creation_failed",
];

pub(crate) const STARTUP_RETRY_INTERVAL: Duration = Duration::from_secs(1);
/// Upper bound on how long to keep retrying a transient startup error before giving up and
/// surfacing it for real - generous because a cold Steam launch (as opposed to one already warm
/// in the background) can legitimately take this long to finish reaching its main UI.
const STARTUP_RETRY_ATTEMPTS: u32 = 20;
/// See [`GAME_UNAVAILABLE_ERROR_CODE`].
const GAME_UNAVAILABLE_RETRY_ATTEMPTS: u32 = 3;
/// Hard ceiling across every code, in case Steam flips between two retryable codes - each code's
/// own budget restarts when the code changes (see [`StartupRetry`]), so without this a flapping
/// client could be retried forever.
const MAX_TOTAL_ATTEMPTS: u32 = STARTUP_RETRY_ATTEMPTS + GAME_UNAVAILABLE_RETRY_ATTEMPTS;

/// Whether `code` means the local Steam client can't serve any game right now - see
/// [`STEAM_UNAVAILABLE_ERROR_CODES`].
pub(crate) fn is_steam_unavailable(code: &str) -> bool {
    STEAM_UNAVAILABLE_ERROR_CODES.contains(&code)
}

/// Whether `code` is a local-Steam failure that clears on its own - the client wide ones above,
/// plus one game being locked by Steam Families. An automation loop should keep that game
/// queued and try again later rather than treating it as done.
pub(crate) fn is_temporary_failure(code: &str) -> bool {
    is_steam_unavailable(code) || code == GAME_UNAVAILABLE_ERROR_CODE
}

/// How many times in a row a command that keeps failing with `code` is run before giving up.
fn attempts_for(code: &str) -> u32 {
    if TRANSIENT_STARTUP_ERROR_CODES.contains(&code) {
        STARTUP_RETRY_ATTEMPTS
    } else if code == GAME_UNAVAILABLE_ERROR_CODE {
        GAME_UNAVAILABLE_RETRY_ATTEMPTS
    } else {
        1
    }
}

/// Retry bookkeeping for one SteamUtility CLI call, shared by [`run_and_parse`] and CLI-mode
/// idling's spawn (`idling::manager`), which can't go through `run_and_parse` since `idle` stays
/// resident. Each code gets its own budget, restarted whenever the code changes: a cold Steam
/// start walks through `steam_not_running` -> `steam_not_ready` -> `steam_game_unavailable` in
/// order, and a shared counter would leave the last step no retries at all.
#[derive(Debug, Default)]
pub(crate) struct StartupRetry {
    total: u32,
    same_code: u32,
    last_code: Option<String>,
}

impl StartupRetry {
    /// Records a failed attempt with `code` and returns whether to try again (after
    /// [`STARTUP_RETRY_INTERVAL`]).
    pub(crate) fn should_retry(&mut self, code: &str) -> bool {
        self.total += 1;
        if self.last_code.as_deref() == Some(code) {
            self.same_code += 1;
        } else {
            self.last_code = Some(code.to_string());
            self.same_code = 1;
        }
        self.same_code < attempts_for(code) && self.total < MAX_TOTAL_ATTEMPTS
    }

    /// Attempts made so far - for log lines.
    pub(crate) fn attempts(&self) -> u32 {
        self.total
    }
}

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
/// [`TRANSIENT_STARTUP_ERROR_CODES`] and [`GAME_UNAVAILABLE_ERROR_CODE`] (see [`StartupRetry`])
/// so a caller doesn't need its own readiness-polling logic.
pub async fn run_and_parse<T: DeserializeOwned>(args: &[&str]) -> AppResult<T> {
    let mut retry = StartupRetry::default();
    loop {
        let code = match run_once(args).await? {
            Ok(value) => return Ok(value),
            Err(code) => code,
        };
        if !retry.should_retry(&code) {
            if retry.attempts() > 1 {
                tracing::warn!(
                    error_code = %code,
                    attempts = retry.attempts(),
                    command = args.first().copied().unwrap_or_default(),
                    "local Steam client still unavailable, giving up"
                );
            }
            return Err(AppError::SteamUtility(code));
        }
        tracing::info!(
            error_code = %code,
            attempt = retry.attempts(),
            "local Steam client couldn't serve the request yet, retrying"
        );
        tokio::time::sleep(STARTUP_RETRY_INTERVAL).await;
    }
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

    Ok(Ok(envelope.result.ok_or_else(|| {
        AppError::SteamUtility("empty result".to_string())
    })?))
}

/// Forwards a long-lived SteamUtility child's stderr (its `Core/Logging/Log.cs` lines) into this
/// app's log, one `on_line` call per non-empty line, until the stream closes - the streaming
/// counterpart to [`run_once`]'s one-shot stderr dump, for the agent daemon and CLI-mode `idle`
/// processes.
///
/// Decodes each line lossily rather than through `AsyncBufReadExt::lines()`: SteamUtility writes
/// stderr in the console code page, not UTF-8, and `lines()` returns an error on the first invalid
/// UTF-8 byte - which ended the forwarding loop silently. On any non-English Windows locale that
/// meant the very first line (a localized month name in its timestamp) dropped every daemon log
/// line after it for the rest of the process's lifetime.
pub(crate) fn forward_stderr<F>(stderr: ChildStderr, on_line: F)
where
    F: FnMut(&str) + Send + 'static,
{
    tauri::async_runtime::spawn(read_lines_lossy(stderr, on_line));
}

/// [`forward_stderr`]'s read loop, generic over the reader so it's testable without a real child
/// process.
async fn read_lines_lossy<R, F>(reader: R, mut on_line: F)
where
    R: AsyncRead + Unpin,
    F: FnMut(&str),
{
    let mut reader = BufReader::new(reader);
    let mut buf = Vec::new();
    loop {
        buf.clear();
        match reader.read_until(b'\n', &mut buf).await {
            Ok(0) => break,
            Ok(_) => {
                let line = String::from_utf8_lossy(&buf);
                let line = line.trim_end_matches(['\r', '\n']);
                if !line.is_empty() {
                    on_line(line);
                }
            }
            Err(e) => {
                tracing::warn!(error = %e, "SteamUtility stderr read failed, no longer forwarding its log lines");
                break;
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn collect(input: &[u8]) -> Vec<String> {
        let mut lines = Vec::new();
        read_lines_lossy(input, |line| lines.push(line.to_string())).await;
        lines
    }

    #[tokio::test]
    async fn keeps_forwarding_past_a_non_utf8_line() {
        // "окт." as Windows-1251 bytes (a ru-RU console code page) - not valid UTF-8, which is
        // exactly what used to end forwarding on the first daemon log line.
        let mut input = b"\xEE\xEA\xF2. 07 15:08:16.870 [Info] [Daemon] Starting\r\n".to_vec();
        input.extend_from_slice(b"Oct 07 15:08:16.900 [Warn] [Daemon] Steam rejected logon\r\n");

        let lines = collect(&input).await;

        assert_eq!(lines.len(), 2);
        assert!(lines[0].ends_with("[Info] [Daemon] Starting"));
        assert_eq!(
            lines[1],
            "Oct 07 15:08:16.900 [Warn] [Daemon] Steam rejected logon"
        );
    }

    #[tokio::test]
    async fn forwards_a_final_line_without_a_trailing_newline_and_skips_blank_ones() {
        assert_eq!(collect(b"first\n\r\n\nlast").await, ["first", "last"]);
    }

    /// How many attempts in total a run of identical failures gets.
    fn attempts_until_give_up(code: &str) -> u32 {
        let mut retry = StartupRetry::default();
        while retry.should_retry(code) {}
        retry.attempts()
    }

    #[test]
    fn retries_each_code_for_its_own_budget() {
        assert_eq!(attempts_until_give_up("steam_not_running"), 20);
        assert_eq!(attempts_until_give_up("steam_not_ready"), 20);
        assert_eq!(attempts_until_give_up("steam_game_unavailable"), 3);
        assert_eq!(attempts_until_give_up("game_not_owned"), 1);
        assert_eq!(attempts_until_give_up("achievement_protected"), 1);
    }

    #[test]
    fn a_cold_steam_start_still_gets_the_short_retry_at_the_end() {
        // The order measured on a real cold start: pipe down, then licenses not loaded, then
        // an owned game failing for a moment. The last step must not inherit the earlier
        // attempts.
        let mut retry = StartupRetry::default();
        for _ in 0..4 {
            assert!(retry.should_retry("steam_not_running"));
        }
        for _ in 0..4 {
            assert!(retry.should_retry("steam_not_ready"));
        }
        assert!(retry.should_retry("steam_game_unavailable"));
        assert!(retry.should_retry("steam_game_unavailable"));
        assert!(!retry.should_retry("steam_game_unavailable"));
    }

    #[test]
    fn a_flapping_client_still_gives_up() {
        let mut retry = StartupRetry::default();
        let mut attempts = 0;
        while retry.should_retry(if attempts % 2 == 0 {
            "steam_not_ready"
        } else {
            "steam_not_running"
        }) {
            attempts += 1;
        }
        assert_eq!(retry.attempts(), MAX_TOTAL_ATTEMPTS);
    }

    #[test]
    fn only_client_wide_codes_stop_a_batch() {
        assert!(is_steam_unavailable("steam_not_running"));
        assert!(is_steam_unavailable("steam_not_ready"));
        assert!(is_steam_unavailable("steam_client_outdated"));
        assert!(!is_steam_unavailable("steam_game_unavailable"));
        assert!(!is_steam_unavailable("game_not_owned"));
    }

    #[test]
    fn a_family_lock_is_temporary_but_not_owning_the_game_is_not() {
        assert!(is_temporary_failure("steam_game_unavailable"));
        assert!(is_temporary_failure("steam_not_ready"));
        assert!(!is_temporary_failure("game_not_owned"));
        assert!(!is_temporary_failure("achievement_protected"));
    }
}
