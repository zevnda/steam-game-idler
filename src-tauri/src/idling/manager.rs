//! CLI-mode idling: owns one `SteamUtility.exe idle <app_id> [name]` child process per currently
//! idling game directly, mirroring `steam_agent::AgentManager`'s ownership model - rather than
//! recovering state by polling the OS process list and parsing hidden window titles. Owning the
//! `Child` handles directly means this module always knows definitively what it started and can
//! diff/kill/poll against that, with no dependency on a window-title string format staying stable.

use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use serde::Deserialize;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, ChildStderr, ChildStdout, Command};
use tokio::sync::Mutex;

use crate::error::{AppError, AppResult};
use crate::steam_utility_exe::{is_steam_unavailable, StartupRetry, STARTUP_RETRY_INTERVAL};

use super::{cap_targets, IdleFailure, IdleSetResult, IdleTarget, IDLE_STATE_EVENT};

/// Win32 `CREATE_NO_WINDOW` - suppresses the console window that would otherwise flash briefly.
/// `idle` itself also creates its own hidden `IdleWindow`, which this flag doesn't affect. This
/// whole module is CLI-mode-only (see module doc) and thus Windows-only in practice, but it must
/// still compile on Linux (never exercised there - no CLI-mode sign-in option in the Linux
/// frontend) rather than being cfg-gated out entirely, so this stays a plain `cfg(windows)` split
/// like every other Windows-only call site instead of excluding the module from the Linux build.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;
/// How long to wait for `idle`'s single startup stdout line before deciding the process is at
/// least alive. `IdleCommand.cs` never prints a second line even on success, so a timeout here
/// means "didn't fail immediately," not "definitely succeeded" - the process could still be
/// legitimately slow to reach `SteamAPI.Init()`.
const STARTUP_TIMEOUT: Duration = Duration::from_secs(5);
/// How often the background poller checks tracked children for exits nothing told it about
/// directly - e.g. Steam itself closing, killing the idle process out from under it.
const POLL_INTERVAL: Duration = Duration::from_secs(2);

#[derive(Debug, Deserialize)]
struct IdleStartEnvelope {
    ok: bool,
    error: Option<String>,
}

struct IdleProcessHandle {
    child: Child,
}

pub struct IdlingManager {
    processes: Mutex<HashMap<u32, IdleProcessHandle>>,
    poller_started: AtomicBool,
}

impl IdlingManager {
    pub fn new() -> Self {
        Self {
            processes: Mutex::new(HashMap::new()),
            poller_started: AtomicBool::new(false),
        }
    }

    /// Replaces the currently-idling set: kills anything tracked but no longer requested, spawns
    /// anything requested but not yet tracked, and leaves already-running overlapping games
    /// untouched (killing+respawning an already-idling game would pointlessly drop its Steam
    /// session for no benefit). Individual spawn failures (e.g. Steam not running) are collected
    /// into `IdleSetResult::failures` rather than failing the whole call - unlike `main`'s old
    /// `start_farm_idle`, this isn't all-or-nothing, matching the daemon side's `idle_set`, where
    /// an unreachable app id in the list doesn't fail the whole announcement either. A failed
    /// target is never tracked, so a later `set_games` call with the same target retries it
    /// naturally - no separate "don't retry" bookkeeping needed.
    pub async fn set_games(
        &self,
        app_handle: &AppHandle,
        targets: Vec<IdleTarget>,
    ) -> AppResult<IdleSetResult> {
        let targets = cap_targets(targets);
        let desired: HashSet<u32> = targets.iter().map(|t| t.app_id).collect();

        let mut processes = self.processes.lock().await;

        let to_remove: Vec<u32> = processes
            .keys()
            .filter(|id| !desired.contains(id))
            .copied()
            .collect();
        for app_id in to_remove {
            if let Some(mut handle) = processes.remove(&app_id) {
                let _ = handle.child.kill().await;
                tracing::info!(app_id, "stopped idling (removed from desired set)");
            }
        }

        let mut failures = Vec::new();
        // Set once a spawn fails because Steam itself can't serve any game (see
        // `steam_utility_exe::is_steam_unavailable`) - every remaining target would only wait out
        // the same ~20s startup retry and fail the same way, so they get that code straight away.
        let mut steam_unavailable: Option<String> = None;
        for target in &targets {
            if processes.contains_key(&target.app_id) {
                continue;
            }
            if let Some(code) = &steam_unavailable {
                failures.push(IdleFailure {
                    app_id: target.app_id,
                    error: code.clone(),
                });
                continue;
            }
            match spawn_idle_process(target).await {
                Ok(child) => {
                    processes.insert(target.app_id, IdleProcessHandle { child });
                    tracing::info!(app_id = target.app_id, name = %target.name, "started idling");
                }
                Err(e) => {
                    tracing::warn!(app_id = target.app_id, error = %e, "failed to start idling");
                    let code = e.code();
                    if is_steam_unavailable(&code) {
                        steam_unavailable = Some(code.clone());
                    }
                    failures.push(IdleFailure {
                        app_id: target.app_id,
                        error: code,
                    });
                }
            }
        }

        let app_ids: Vec<u32> = processes.keys().copied().collect();
        drop(processes);

        self.ensure_poller_started(app_handle);
        let _ = app_handle.emit(IDLE_STATE_EVENT, serde_json::json!({ "appIds": app_ids }));

        Ok(IdleSetResult { app_ids, failures })
    }

    pub async fn get_state(&self) -> Vec<u32> {
        self.processes.lock().await.keys().copied().collect()
    }

    /// Kills every tracked process - used directly by `updater::kill_all_steam_utility_processes`'s
    /// pre-install cleanup pass, since an update install can't overwrite `SteamUtility.exe` while
    /// a spawned idle process still holds it open.
    pub async fn kill_all(&self) {
        let mut processes = self.processes.lock().await;
        for (_, mut handle) in processes.drain() {
            let _ = handle.child.kill().await;
        }
    }

    fn ensure_poller_started(&self, app_handle: &AppHandle) {
        if self
            .poller_started
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
        {
            let app_handle = app_handle.clone();
            tokio::spawn(run_poller(app_handle));
        }
    }
}

/// Runs for the app's lifetime once started by the first `set_games` call - cheap no-op ticks
/// when nothing is tracked, so there's no cost to leaving it running rather than stopping/
/// restarting it as the tracked set empties and refills. Fetches `IdlingManager` fresh from
/// `app_handle` each tick (rather than capturing `&IdlingManager` directly) since Tauri-managed
/// state has no stable owned reference to capture into a `'static` task.
async fn run_poller(app_handle: AppHandle) {
    let mut interval = tokio::time::interval(POLL_INTERVAL);
    loop {
        interval.tick().await;

        let manager = app_handle.state::<IdlingManager>();
        let mut processes = manager.processes.lock().await;
        if processes.is_empty() {
            continue;
        }

        let mut died = Vec::new();
        for (app_id, handle) in processes.iter_mut() {
            match handle.child.try_wait() {
                Ok(Some(_status)) => died.push(*app_id),
                Ok(None) => {}
                Err(e) => {
                    tracing::warn!(app_id, error = %e, "failed to poll idle process status");
                }
            }
        }
        if died.is_empty() {
            continue;
        }

        for app_id in &died {
            processes.remove(app_id);
            tracing::warn!(app_id, "idle process exited unexpectedly");
        }

        let app_ids: Vec<u32> = processes.keys().copied().collect();
        drop(processes);

        let _ = app_handle.emit(IDLE_STATE_EVENT, serde_json::json!({ "appIds": app_ids }));
    }
}

/// Spawns `idle` for `target`, retrying a Steam that's still starting the same way every other
/// CLI-mode command does through `steam_utility_exe::run_and_parse` (see [`StartupRetry`]) - this
/// path can't use `run_and_parse` itself because `idle` stays resident instead of exiting. Matters
/// most at Windows sign-in, when Steam and this app autostart together and auto-idle fires
/// before Steam has finished loading. A code SteamUtility reported comes back as
/// `AppError::SteamUtility(code)`, so the Idling page can say why (e.g. `game_not_owned`) instead
/// of a generic "couldn't start idling".
async fn spawn_idle_process(target: &IdleTarget) -> AppResult<Child> {
    let mut retry = StartupRetry::default();
    loop {
        let code = match try_spawn_idle_process(target).await? {
            Ok(child) => return Ok(child),
            Err(code) => code,
        };
        if !retry.should_retry(&code) {
            return Err(AppError::SteamUtility(code));
        }
        tracing::info!(
            app_id = target.app_id,
            error_code = %code,
            attempt = retry.attempts(),
            "local Steam client couldn't start idling yet, retrying"
        );
        tokio::time::sleep(STARTUP_RETRY_INTERVAL).await;
    }
}

/// One `idle` spawn attempt - `Ok(Err(code))` when SteamUtility reported a failure code (which
/// [`spawn_idle_process`] may retry), `Err` for anything it can't (the spawn itself failing, or
/// the process dying without saying why).
async fn try_spawn_idle_process(target: &IdleTarget) -> AppResult<Result<Child, String>> {
    let exe_path = crate::steam_utility_exe::locate()?;

    let mut command = Command::new(&exe_path);
    command
        .arg("idle")
        .arg(target.app_id.to_string())
        .arg(&target.name)
        .kill_on_drop(true)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());
    #[cfg(windows)]
    command.creation_flags(CREATE_NO_WINDOW);

    let mut child = command.spawn().map_err(AppError::ProcessSpawn)?;

    let stdout = child.stdout.take().expect("stdout was piped at spawn");
    let stderr = child.stderr.take().expect("stderr was piped at spawn");
    forward_idle_stderr(stderr, target.app_id);

    match await_startup_line(stdout, &mut child).await {
        Ok(()) => Ok(Ok(child)),
        Err(failure) => {
            let _ = child.kill().await;
            match failure {
                StartupFailure::Reported(code) => Ok(Err(code)),
                StartupFailure::Exited => Err(AppError::IdleProcessStartFailed {
                    app_id: target.app_id,
                    reason: "process exited before reporting status".to_string(),
                }),
            }
        }
    }
}

/// Why `idle` didn't start - see [`await_startup_line`].
enum StartupFailure {
    /// SteamUtility printed `{"ok":false,"error":code}` - a code worth retrying or showing.
    Reported(String),
    /// The process exited without printing anything - no code to go on.
    Exited,
}

/// Waits (briefly) for `idle`'s one possible startup line and interprets it - see
/// `STARTUP_TIMEOUT`'s doc comment for why a timeout isn't itself treated as failure.
async fn await_startup_line(stdout: ChildStdout, child: &mut Child) -> Result<(), StartupFailure> {
    let mut lines = BufReader::new(stdout).lines();
    match tokio::time::timeout(STARTUP_TIMEOUT, lines.next_line()).await {
        Ok(Ok(Some(line))) => {
            // Only an explicit `{"ok":false,...}` is a real failure; anything else (including an
            // unrecognized line) is treated as "started," matching `idle`'s contract of printing
            // at most one line, ever.
            if let Ok(envelope) = serde_json::from_str::<IdleStartEnvelope>(&line) {
                if !envelope.ok {
                    return Err(StartupFailure::Reported(
                        envelope
                            .error
                            .unwrap_or_else(|| "unknown_error".to_string()),
                    ));
                }
            }
            Ok(())
        }
        // Timed out, or the process closed stdout without printing anything - only a real
        // failure if the process has actually exited; a live process that's merely slow to print
        // is still worth tracking.
        _ => match child.try_wait() {
            Ok(Some(_status)) => Err(StartupFailure::Exited),
            _ => Ok(()),
        },
    }
}

fn forward_idle_stderr(stderr: ChildStderr, app_id: u32) {
    crate::steam_utility_exe::forward_stderr(stderr, move |line| {
        tracing::info!(app_id, "steam_utility: {line}");
    });
}
