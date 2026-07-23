use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex as StdMutex};
use std::time::Duration;

use tauri::{AppHandle, Emitter, Manager};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin, Command};
use tokio::sync::{oneshot, Mutex};

use crate::error::{AppError, AppResult};

use super::ipc::{IpcLine, IpcMessage, IpcRequest, IpcResponse};

/// Conservative upper bound for a Steam network round trip; not derived from any specific
/// SteamKit2/Steam API deadline - just long enough that a miss means the request is genuinely
/// stuck, not merely slow. Fine for every request type except `get_owned_apps` - see
/// `OWNED_APPS_REQUEST_TIMEOUT`.
const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
/// `get_owned_apps` is the one daemon request whose cost scales with the account's library size,
/// not a fixed per-call cost like every other command here. `OwnershipManager.GetOwnedGamesAsync`
/// (`libs/SteamUtility/Daemon/Bot/OwnershipManager.cs`) resolves ownership via PICS: one
/// `PICSGetProductInfo` batch over every owned package/license, then another over every resolved
/// app id - for a 5,000-10,000+ game library that's thousands of individual PICS requests, and
/// Steam's PICS service measurably slows down on large batches. `REQUEST_TIMEOUT`'s 30s was tuned
/// for single-app-scale commands (login, achievements, idle_set) and reliably fired mid-resolution
/// for large libraries even though the daemon was still working, not stuck - see the
/// `agent_request_timeout` incident this constant was added to fix.
pub(crate) const OWNED_APPS_REQUEST_TIMEOUT: Duration = Duration::from_secs(600);
/// Event emitted to the frontend for every SteamUtility async event (`status_changed`,
/// `idle_state`, `auth_required`, `refresh_token`, `login_failed`, `guard_code_incorrect`, ...).
/// One channel for all of them, distinguished by the `event`/`account` fields in the payload,
/// rather than one Tauri event name per SteamUtility event - keeps the frontend's listener surface
/// to a single `listen()` call regardless of how many event types SteamUtility grows.
pub const AGENT_EVENT: &str = "steam-agent-event";
/// Win32 `CREATE_NO_WINDOW` process-creation flag - suppresses the console window that would
/// otherwise flash briefly for the spawned SteamUtility agent process. No Linux equivalent needed
/// - a spawned child there has no console window to flash in the first place.
#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

type PendingMap = Arc<StdMutex<HashMap<String, oneshot::Sender<IpcResponse>>>>;

/// One spawned `SteamUtility.exe agent` child process plus its IPC plumbing. One `AgentProcess`
/// exists per logged-in-or-logging-in account - see `AgentManager` for the account-keyed map this
/// lives behind.
pub struct AgentProcess {
    child: Mutex<Child>,
    stdin: Mutex<ChildStdin>,
    pending: PendingMap,
    next_id: AtomicU64,
    /// The key this process's stdout/stderr reader tasks tag every log line and emitted event
    /// with - shared (not a plain `String`) so [`Self::rekey`] can update it in place once a QR
    /// login resolves a real username, and have that change picked up by the reader tasks
    /// spawned back in [`Self::spawn`], which otherwise captured the QR placeholder key by value
    /// forever. See `AgentManager::promote_pending_qr_session`'s doc comment for the other half
    /// of QR re-keying (moving this process to its real key in `AgentManager::sessions`).
    account_key: Arc<StdMutex<String>>,
    /// The account's SteamID64, learned from the daemon's `status_changed` event (see
    /// `handle_line`) - `None` until a successful logon actually resolves one. `games::commands`
    /// needs this to key the owned-games cache the same way CLI mode's already-known `steam_id`
    /// does, since agent mode has no local `loginusers.vdf` to read one from up front.
    steam_id: Arc<StdMutex<Option<String>>>,
    /// The daemon's last-reported idling set, learned from `idle_state` events (see
    /// `handle_line`) - empty until the first `idle_set` round trip. `idling::commands::get_idle_state`
    /// reads this directly; `AgentManager::set_idle_games` doesn't wait for it (see that method's
    /// doc comment for why).
    idle_app_ids: Arc<StdMutex<Vec<u32>>>,
}

impl AgentProcess {
    pub fn spawn(app_handle: AppHandle, account_key: String) -> AppResult<Self> {
        let exe_path = crate::steam_utility_exe::locate_for_agent(&app_handle)?;

        let mut command = Command::new(&exe_path);
        command
            .arg("agent")
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .kill_on_drop(true);
        #[cfg(windows)]
        command.creation_flags(CREATE_NO_WINDOW);

        let mut child = command.spawn()?;

        let stdin = child.stdin.take().expect("stdin was piped at spawn");
        let stdout = child.stdout.take().expect("stdout was piped at spawn");
        let stderr = child.stderr.take().expect("stderr was piped at spawn");

        let pending: PendingMap = Arc::new(StdMutex::new(HashMap::new()));
        let account_key: Arc<StdMutex<String>> = Arc::new(StdMutex::new(account_key));
        let steam_id: Arc<StdMutex<Option<String>>> = Arc::new(StdMutex::new(None));
        let idle_app_ids: Arc<StdMutex<Vec<u32>>> = Arc::new(StdMutex::new(Vec::new()));

        spawn_stdout_reader(
            stdout,
            pending.clone(),
            app_handle,
            account_key.clone(),
            steam_id.clone(),
            idle_app_ids.clone(),
        );
        spawn_stderr_forwarder(stderr, account_key.clone());

        let logged_key = account_key.lock().unwrap().clone();
        tracing::info!(account = %logged_key, exe = %exe_path.display(), "spawned SteamUtility agent process");

        Ok(Self {
            child: Mutex::new(child),
            stdin: Mutex::new(stdin),
            pending,
            next_id: AtomicU64::new(1),
            account_key,
            steam_id,
            idle_app_ids,
        })
    }

    /// The account's SteamID64, once a `status_changed` event has resolved one - see the `steam_id`
    /// field doc comment.
    pub fn steam_id(&self) -> Option<String> {
        self.steam_id.lock().unwrap().clone()
    }

    /// The daemon's last-reported idling set - see the `idle_app_ids` field doc comment.
    pub fn idle_app_ids(&self) -> Vec<u32> {
        self.idle_app_ids.lock().unwrap().clone()
    }

    /// Updates the key this process's reader tasks tag every subsequent log line/emitted event
    /// with - see the `account_key` field doc comment. Called by `AgentManager::
    /// promote_pending_qr_session` once a QR login resolves a real username.
    pub fn rekey(&self, new_key: &str) {
        *self.account_key.lock().unwrap() = new_key.to_string();
    }

    /// Sends one request and awaits its matching response by `id`, capped at the default
    /// `REQUEST_TIMEOUT` - SteamUtility guarantees exactly one response per request `id` (see
    /// `DaemonHost.HandleLineAsync`), so a missing response after the timeout means the round trip
    /// is genuinely stuck rather than merely slow. Use `send_request_with_timeout` directly for a
    /// command whose cost isn't fixed-per-call (currently only `get_owned_apps`).
    pub async fn send_request(
        &self,
        build: impl FnOnce(String) -> IpcRequest,
    ) -> AppResult<IpcResponse> {
        self.send_request_with_timeout(build, REQUEST_TIMEOUT).await
    }

    /// Same as `send_request`, with an explicit timeout override - see `OWNED_APPS_REQUEST_TIMEOUT`
    /// for why this exists as a separate entry point rather than just raising `REQUEST_TIMEOUT`
    /// globally.
    pub async fn send_request_with_timeout(
        &self,
        build: impl FnOnce(String) -> IpcRequest,
        timeout: Duration,
    ) -> AppResult<IpcResponse> {
        let id = self.next_id.fetch_add(1, Ordering::Relaxed).to_string();
        let request = build(id.clone());

        let (tx, rx) = oneshot::channel();
        self.pending.lock().unwrap().insert(id.clone(), tx);

        let mut line = serde_json::to_string(&request)?;
        line.push('\n');

        {
            let mut stdin = self.stdin.lock().await;
            if let Err(e) = stdin.write_all(line.as_bytes()).await {
                self.pending.lock().unwrap().remove(&id);
                return Err(AppError::ProcessSpawn(e));
            }
        }

        match tokio::time::timeout(timeout, rx).await {
            Ok(Ok(response)) => Ok(response),
            Ok(Err(_)) => Err(AppError::ProcessExited),
            Err(_) => {
                self.pending.lock().unwrap().remove(&id);
                Err(AppError::RequestTimeout)
            }
        }
    }

    pub async fn kill(&self) {
        let mut child = self.child.lock().await;
        let _ = child.kill().await;
    }
}

fn spawn_stdout_reader(
    stdout: tokio::process::ChildStdout,
    pending: PendingMap,
    app_handle: AppHandle,
    account_key: Arc<StdMutex<String>>,
    steam_id: Arc<StdMutex<Option<String>>>,
    idle_app_ids: Arc<StdMutex<Vec<u32>>>,
) {
    tokio::spawn(async move {
        let mut lines = BufReader::new(stdout).lines();
        loop {
            match lines.next_line().await {
                Ok(Some(line)) => {
                    if line.trim().is_empty() {
                        continue;
                    }
                    handle_line(
                        &line,
                        &pending,
                        &app_handle,
                        &account_key,
                        &steam_id,
                        &idle_app_ids,
                    )
                    .await;
                }
                Ok(None) => break,
                Err(e) => {
                    let key = account_key.lock().unwrap().clone();
                    tracing::warn!(account = %key, error = %e, "steam agent stdout read error");
                    break;
                }
            }
        }

        let key = account_key.lock().unwrap().clone();
        tracing::info!(account = %key, "steam agent stdout closed, process has exited");
        let mut pending = pending.lock().unwrap();
        for (_, tx) in pending.drain() {
            let _ = tx.send(IpcResponse {
                ok: false,
                result: None,
                error: Some("agent_process_exited".to_string()),
            });
        }
    });
}

fn spawn_stderr_forwarder(stderr: tokio::process::ChildStderr, account_key: Arc<StdMutex<String>>) {
    tokio::spawn(async move {
        let mut lines = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let key = account_key.lock().unwrap().clone();
            tracing::info!(account = %key, "steam_utility: {line}");
        }
    });
}

async fn handle_line(
    line: &str,
    pending: &PendingMap,
    app_handle: &AppHandle,
    account_key: &Arc<StdMutex<String>>,
    steam_id: &Arc<StdMutex<Option<String>>>,
    idle_app_ids: &Arc<StdMutex<Vec<u32>>>,
) {
    let message: IpcMessage = match serde_json::from_str(line) {
        Ok(m) => m,
        Err(e) => {
            let key = account_key.lock().unwrap().clone();
            tracing::warn!(account = %key, error = %e, raw = %line, "failed to parse steam agent IPC line");
            return;
        }
    };

    match message.classify() {
        IpcLine::Response {
            id,
            ok,
            result,
            error,
        } => {
            let Some(id) = id else {
                let key = account_key.lock().unwrap().clone();
                tracing::warn!(account = %key, "steam agent response line missing id");
                return;
            };
            if let Some(tx) = pending.lock().unwrap().remove(&id) {
                let _ = tx.send(IpcResponse { ok, result, error });
            }
        }
        IpcLine::Event { name, payload } => {
            let key = account_key.lock().unwrap().clone();
            tracing::info!(account = %key, event = %name, "steam agent event");

            if name == "refresh_token" {
                if let Some(real_key) = persist_refresh_token(app_handle, &key, &payload) {
                    // No-op for the credentials flow, whose account_key already equals real_key -
                    // only a QR attempt's placeholder key ever needs re-keying. See
                    // `AgentManager::promote_pending_qr_session`'s doc comment.
                    if real_key != key {
                        app_handle
                            .state::<crate::steam_agent::AgentManager>()
                            .promote_pending_qr_session(&key, &real_key)
                            .await;
                        // Updates the shared cell `spawn_stdout_reader`/`spawn_stderr_forwarder`
                        // read from - without this, this process's reader tasks keep tagging
                        // every subsequent event (idle_state, status_changed, ...) with the QR
                        // placeholder key forever, which the frontend's `sessionStore` (keyed by
                        // the real username once resolved) can never match - silently dropping
                        // every one of those events for the rest of this process's lifetime. See
                        // the `account_key` field doc comment on `AgentProcess`.
                        *account_key.lock().unwrap() = real_key;
                    }
                }
            }

            if name == "status_changed" {
                let resolved = payload.get("steamId").and_then(|v| v.as_str());
                let reconnecting =
                    payload.get("result").and_then(|v| v.as_str()) == Some("Reconnecting");
                let kicked =
                    payload.get("result").and_then(|v| v.as_str()) == Some("LoggedInElsewhere");

                if kicked {
                    // Must run before the cache-clearing branch below - should_update_steam_id
                    // nulls the cache for exactly this case (no resolved steamId, not
                    // "Reconnecting"), and the stop calls need the last-known SteamID64 to find
                    // this account's running automation.
                    let last_steam_id = steam_id.lock().unwrap().clone();
                    match last_steam_id {
                        Some(sid) => {
                            // Spawned, not awaited inline - this loop is the sole reader of this
                            // account's AgentProcess stdout, and handle_session_superseded's idle-
                            // claims clear sends an `idle_set` IPC request back to that same
                            // process and awaits its response. Awaiting it here would deadlock:
                            // the response can only ever be read by this same loop reading its
                            // next line, which can't happen while it's blocked awaiting this call
                            // (observed as a real 30s REQUEST_TIMEOUT stall in testing, which also
                            // delayed the generic AGENT_EVENT emit below by the same 30s since it
                            // runs later in this function).
                            let app_handle = app_handle.clone();
                            let key = key.clone();
                            tauri::async_runtime::spawn(async move {
                                handle_session_superseded(&app_handle, &key, &sid).await;
                            });
                        }
                        None => tracing::warn!(
                            account = %key,
                            "steam agent: account kicked by concurrent login, but no cached steamId to stop automation with"
                        ),
                    }
                }

                if should_update_steam_id(resolved, reconnecting) {
                    *steam_id.lock().unwrap() = resolved.map(|s| s.to_string());
                }
            }

            // Additional, backend-agnostic forward on top of the generic `steam-agent-event`
            // below - see `idling::IDLE_STATE_EVENT`'s doc comment for why the idling feature
            // gets its own unified event rather than requiring the frontend to filter/branch on
            // `steam-agent-event` by sign-in mode.
            if name == "idle_state" {
                let ids: Vec<u32> = payload
                    .get("appIds")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_u64().map(|n| n as u32))
                            .collect()
                    })
                    .unwrap_or_default();
                *idle_app_ids.lock().unwrap() = ids.clone();
                let _ = app_handle.emit(
                    crate::idling::IDLE_STATE_EVENT,
                    serde_json::json!({ "account": key, "appIds": ids }),
                );
            }

            // Deliberately reuses `key` from the top of this arm, NOT a fresh post-rekey read - a
            // `refresh_token` event produced by a QR attempt must still be emitted under the
            // placeholder key the frontend is still watching for at this exact moment
            // (`useAgentQrSignIn.ts`'s `sessionKeyRef`, only updated to `null`/resolved *inside*
            // its `refresh_token` handler). Emitting the already-rekeyed real key here means the
            // frontend's `payload.account !== sessionKeyRef.current` filter never matches, so the
            // handler - and the QR sign-in flow - never fires at all, even though the daemon and
            // Rust backend both completed the login successfully. Every *subsequent* event for
            // this process still gets the new key correctly, since each is a fresh `handle_line`
            // call that re-reads `account_key` at its own top, after the rekey above has landed.
            let _ = app_handle.emit(
                AGENT_EVENT,
                serde_json::json!({
                    "account": key,
                    "event": name,
                    "payload": payload,
                }),
            );
        }
    }
}

/// Reacts to `status_changed{result: "LoggedInElsewhere"}` - the account was force-logged-off by
/// Steam because it signed in elsewhere (another device/session, or the real Steam client). Stops
/// this account's automation via the exact same underlying calls
/// `stop_farming`/`stop_achievement_unlocker`/`stop_all_idling` already make, rather than letting
/// the daemon's own auto-reconnect (already suppressed for this case - see
/// `SteamBot.cs::OnDisconnected`) leave stale automation state around. Runs unconditionally here
/// (not gated behind the frontend being mounted/listening) so pausing is reliable regardless of
/// whether anyone's looking at the app right now.
///
/// Deliberately does not call `agent_logout`/kill the `AgentProcess` - the daemon connection is
/// already dead Steam-side, and keeping the process alive means a normal re-login later
/// (`AgentManager::login`, whose `respawn()` already kills any stale existing process for the key
/// and spawns fresh) is all that's needed to resume - no separate "resume" path required.
async fn handle_session_superseded(app_handle: &AppHandle, account_key: &str, steam_id: &str) {
    if let Err(e) = app_handle
        .state::<crate::card_farming::CardFarmingManager>()
        .stop(steam_id)
        .await
    {
        tracing::warn!(account = %account_key, error = %e, "steam agent: failed to stop card farming after concurrent-login kick");
    }

    if let Err(e) = app_handle
        .state::<crate::achievement_unlocker::AchievementUnlockerManager>()
        .stop(steam_id)
        .await
    {
        tracing::warn!(account = %account_key, error = %e, "steam agent: failed to stop achievement unlocker after concurrent-login kick");
    }

    let account = crate::games::commands::GamesAccount::Agent {
        username: account_key.to_string(),
    };
    if let Err(e) = app_handle
        .state::<crate::idling::claims::IdleClaimsRegistry>()
        .clear_all(
            app_handle,
            app_handle.state::<crate::steam_agent::AgentManager>(),
            app_handle.state::<crate::idling::IdlingManager>(),
            account,
        )
        .await
    {
        tracing::warn!(account = %account_key, error = %e, "steam agent: failed to clear idle claims after concurrent-login kick");
    }

    tracing::warn!(
        account = %account_key,
        "steam agent: account signed in on another device - automation paused, re-authentication required"
    );
}

/// Whether a `status_changed` event's `steamId` should overwrite `AgentProcess::steam_id`'s cache.
///
/// SteamBot's own auto-reconnect/backoff (`SteamBot.cs::OnDisconnected`) already recovers from a
/// transient network drop on its own - it reports that case as `result: "Reconnecting"`
/// specifically so the cached steam_id survives it instead of being nulled. Nulling it on every
/// disconnect (including transient ones) used to make `AgentManager::login_with_token`'s "already
/// logged on" short-circuit miss during the reconnect window, re-sending a real `LogOnAsync`
/// against a connection that's already mid-reconnect. A genuine disconnect or a real failed logon
/// has no resolved steamId and isn't "Reconnecting", so it still clears the cache.
fn should_update_steam_id(resolved: Option<&str>, reconnecting: bool) -> bool {
    resolved.is_some() || !reconnecting
}

/// `AuthFlow.LoginWithCredentialsAsync`/`LoginWithQrAsync` emit a `refresh_token` event
/// (`{username, tokenB64}`) right after a successful logon - captured here so `login_with_token`
/// can resume the session on a later app start without the frontend having to shuttle the token
/// through itself. Returns the resolved account's normalized key on success, so the caller can
/// detect (and act on) a mismatch against `account_key` - see the QR re-keying comment at the
/// call site.
///
/// The token goes to the OS credential store (a bearer credential equivalent to a password for
/// the account - see `credential_store`'s module doc), never to `settings.json`. The username
/// roster in `settings.json` is only updated once that save succeeds, so it never claims a saved
/// session that doesn't actually have a retrievable token behind it.
///
/// Deliberately keys the credential store/settings roster off the payload's `username`
/// (normalized the same way `AgentManager::key_for` does), not off `account_key` - they coincide
/// for the credentials flow (whose `account_key` already *is* the real key), but a QR attempt's
/// `account_key` is only a placeholder until this event resolves the real one.
fn persist_refresh_token(
    app_handle: &AppHandle,
    account_key: &str,
    payload: &HashMap<String, serde_json::Value>,
) -> Option<String> {
    let username = payload.get("username").and_then(|v| v.as_str());
    let token_b64 = payload.get("tokenB64").and_then(|v| v.as_str());

    let (Some(username), Some(token_b64)) = (username, token_b64) else {
        tracing::warn!(account = %account_key, "refresh_token event missing username/tokenB64 fields");
        return None;
    };

    let real_key = username.trim().to_lowercase();

    if let Err(e) = crate::credential_store::save_refresh_token(&real_key, token_b64) {
        tracing::error!(account = %real_key, error = %e, "failed to save refresh token to OS credential store");
        return None;
    }

    if let Err(e) = crate::settings::record_agent_account(app_handle, username) {
        tracing::error!(account = %real_key, error = %e, "failed to record saved agent account");
    }

    Some(real_key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_resolved_steam_id_always_updates_the_cache() {
        assert!(should_update_steam_id(Some("76561198000000000"), false));
        assert!(should_update_steam_id(Some("76561198000000000"), true));
    }

    #[test]
    fn a_transient_reconnect_with_no_resolved_id_keeps_the_cached_value() {
        assert!(!should_update_steam_id(None, true));
    }

    #[test]
    fn a_genuine_disconnect_or_failed_logon_clears_the_cache() {
        assert!(should_update_steam_id(None, false));
    }
}
