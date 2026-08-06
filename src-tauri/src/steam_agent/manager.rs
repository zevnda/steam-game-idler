use std::collections::HashMap;
use std::sync::Arc;

use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tokio::sync::Mutex;

use crate::credential_store;
use crate::error::{AppError, AppResult};
use crate::settings;

use super::ipc::{AchievementChange, IpcRequest, IpcResponse};
use super::process::{AgentProcess, OWNED_APPS_REQUEST_TIMEOUT};

/// Outcome of a `login` (or `submit_guard_code`) round trip, mirroring the `status` values
/// `AuthFlow.cs` can send back for the `login` command: immediate success, or a prompt that the
/// frontend must resolve via `agent_submit_guard_code` before the account is actually logged on.
#[derive(Debug, Clone, Serialize)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "status"
)]
pub enum LoginOutcome {
    Success,
    NeedGuardCode {
        guard_type: String,
        detail: Option<String>,
    },
    NeedGuardConfirmation,
}

/// Result of [`AgentManager::begin_qr_login`] - `session_key` is a placeholder identifier (not a
/// normalized username, since none is known yet) that the frontend must use to filter subsequent
/// `steam-agent-event`s for this attempt, exactly like it already filters by normalized username
/// for the credentials flow (see `useAgentSignIn.ts`'s `activeAccountRef`).
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QrChallenge {
    pub session_key: String,
    pub challenge_url: String,
}

/// A Steam Community web session derived directly from an agent-mode account's already-
/// authenticated daemon connection, no interactive login/webview needed - see
/// `AgentManager::get_web_session` and `Daemon/Bot/AuthFlow.cs::GetWebSessionAsync`. The daemon's
/// response also carries a `steamId`, deliberately not modeled here - the caller already has one
/// (it's what keys the session it's calling on). `sid` (`sessionid`) is likewise deliberately not
/// part of this - it's an opaque client-generated token Steam Community never actually issues, so
/// `card_farming::session` mints its own rather than expecting one from the daemon.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebSession {
    pub steam_login_secure: String,
}

/// Account-keyed map of live `SteamUtility.exe agent` processes/sessions - deliberately not a
/// singleton `Option<AgentProcess>`, since multi-account support means more than one entry.
pub struct AgentManager {
    sessions: Mutex<HashMap<String, Arc<AgentProcess>>>,
    /// QR sign-in attempts that haven't resolved a username yet, keyed by the placeholder
    /// `session_key` returned from [`begin_qr_login`](Self::begin_qr_login) - see that method's
    /// doc comment. Promoted into `sessions` under the real, normalized username by
    /// [`promote_pending_qr_session`](Self::promote_pending_qr_session) once the daemon's
    /// `refresh_token` event resolves one; never populated by the credentials flow, which already
    /// knows its real key upfront.
    pending_qr: Mutex<HashMap<String, Arc<AgentProcess>>>,
    /// Per-account-key serialization for [`login_with_token`](Self::login_with_token) - keyed
    /// separately from `sessions` since it must exist (and be lockable) before a session does.
    /// Without this, two overlapping resume attempts for the same account (e.g. a second app
    /// window reload landing while the first reload's resume for that account is still mid-flight)
    /// can both pass the `steam_id().is_some()` no-op check below before either has logged on, and
    /// both go on to send a real `login_with_token` IPC request - two concurrent `LogOnAsync` calls
    /// against the same `SteamBot`, which only keeps one pending-logon/license-list waiter each
    /// (`SteamBot.cs`'s `_pendingLogOnTcs`/`_licenseListTcs`), so the loser's waiter is silently
    /// orphaned and the resulting overlapping logon traffic can disrupt the whole CM connection
    /// (observed as repeated `TaskCanceledException`s out of `OwnershipManager` and an account's
    /// resume failing for that boot cycle). Serializing here means the second caller simply waits
    /// for the first to finish, then re-hits the no-op check and returns immediately instead of
    /// sending a duplicate logon.
    resume_locks: Mutex<HashMap<String, Arc<Mutex<()>>>>,
}

impl AgentManager {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
            pending_qr: Mutex::new(HashMap::new()),
            resume_locks: Mutex::new(HashMap::new()),
        }
    }

    async fn resume_lock(&self, key: &str) -> Arc<Mutex<()>> {
        self.resume_locks
            .lock()
            .await
            .entry(key.to_string())
            .or_insert_with(|| Arc::new(Mutex::new(())))
            .clone()
    }

    fn key_for(username: &str) -> String {
        username.trim().to_lowercase()
    }

    /// Opaque placeholder session key for a QR attempt - not a normalized username (none is known
    /// yet), just random bytes in the same shape `steam_community::session::generate_session_id`
    /// already uses elsewhere in this codebase for a similar "opaque client-side token" need.
    /// Prefixed so it can never collide with a real normalized username key in `sessions`.
    fn generate_qr_session_key() -> String {
        use rand::RngCore;
        let mut bytes = [0u8; 12];
        rand::thread_rng().fill_bytes(&mut bytes);
        let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
        format!("qr-{hex}")
    }

    /// Kills any existing process for this account and spawns a fresh one. Used for `login`
    /// (credential flow) so a retried login never reuses a process that's mid-auth-flow (or
    /// mid-guard-code-prompt) from an earlier, possibly-abandoned attempt.
    async fn respawn(&self, app_handle: &AppHandle, key: &str) -> AppResult<Arc<AgentProcess>> {
        let mut sessions = self.sessions.lock().await;
        if let Some(old) = sessions.remove(key) {
            old.kill().await;
        }
        let process = Arc::new(AgentProcess::spawn(app_handle.clone(), key.to_string())?);
        sessions.insert(key.to_string(), process.clone());
        Ok(process)
    }

    async fn get_or_spawn(
        &self,
        app_handle: &AppHandle,
        key: &str,
    ) -> AppResult<Arc<AgentProcess>> {
        let mut sessions = self.sessions.lock().await;
        if let Some(existing) = sessions.get(key) {
            return Ok(existing.clone());
        }
        let process = Arc::new(AgentProcess::spawn(app_handle.clone(), key.to_string())?);
        sessions.insert(key.to_string(), process.clone());
        Ok(process)
    }

    async fn existing(&self, key: &str) -> AppResult<Arc<AgentProcess>> {
        self.sessions
            .lock()
            .await
            .get(key)
            .cloned()
            .ok_or(AppError::SessionNotFound)
    }

    pub async fn login(
        &self,
        app_handle: &AppHandle,
        username: String,
        password: String,
    ) -> AppResult<LoginOutcome> {
        let key = Self::key_for(&username);
        let process = self.respawn(app_handle, &key).await?;

        let pass_b64 = base64::engine::general_purpose::STANDARD.encode(password.as_bytes());
        let response = process
            .send_request(move |id| IpcRequest::login(id, username, pass_b64))
            .await?;

        let outcome = parse_login_response(response);
        match &outcome {
            Ok(o) => tracing::info!(account = %key, outcome = ?o, "agent login"),
            Err(e) => tracing::warn!(account = %key, error = %e, "agent login failed"),
        }
        if matches!(outcome, Ok(LoginOutcome::Success)) {
            self.apply_saved_persona_state(app_handle, &key).await;
        }
        outcome
    }

    /// Starts a QR sign-in attempt: spawns a fresh `AgentProcess` tagged with a placeholder
    /// [`generate_qr_session_key`](Self::generate_qr_session_key) (no real username exists yet -
    /// unlike [`login`](Self::login), which already knows its real key upfront) and returns the
    /// challenge URL to render as a QR code. Only one QR attempt is tracked per call - a repeat
    /// call doesn't kill prior *unrelated* pending attempts, since a future multi-account "add
    /// account" flow could reasonably have more than one in flight; each gets its own key.
    pub async fn begin_qr_login(&self, app_handle: &AppHandle) -> AppResult<QrChallenge> {
        let session_key = Self::generate_qr_session_key();
        let process = Arc::new(AgentProcess::spawn(
            app_handle.clone(),
            session_key.clone(),
        )?);

        let response = process.send_request(IpcRequest::begin_qr_login).await;
        let response = match response {
            Ok(r) => r,
            Err(e) => {
                tracing::warn!(session_key = %session_key, error = %e, "agent QR login failed to start");
                process.kill().await;
                return Err(e);
            }
        };

        if !response.ok {
            let error = response
                .error
                .unwrap_or_else(|| "qr_login_failed".to_string());
            tracing::warn!(session_key = %session_key, error = %error, "agent QR login failed to start");
            process.kill().await;
            return Err(AppError::Agent(error));
        }

        let challenge_url = response
            .result
            .as_ref()
            .and_then(|r| r.get("challengeUrl"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .ok_or_else(|| AppError::Agent("qr_login_missing_challenge_url".to_string()))?;

        self.pending_qr
            .lock()
            .await
            .insert(session_key.clone(), process);

        tracing::info!(session_key = %session_key, "agent QR login started");

        Ok(QrChallenge {
            session_key,
            challenge_url,
        })
    }

    /// Abandons a pending QR attempt (user hit back/cancel, or the UI unmounted before a scan) -
    /// kills the process outright rather than a clean `logout`, since it was never logged on.
    /// A no-op if `session_key` already resolved (moved into `sessions`) or never existed.
    pub async fn cancel_qr_login(&self, session_key: &str) {
        if let Some(process) = self.pending_qr.lock().await.remove(session_key) {
            process.kill().await;
        }
    }

    /// Moves a resolved QR session from `pending_qr` into `sessions` under its real, normalized
    /// key, once `process.rs`'s `refresh_token` handling has learned the account's username.
    /// Called unconditionally on every `refresh_token` event regardless of which flow produced it
    /// (see that call site) - a no-op here whenever `event_account_key` isn't a pending QR key,
    /// which covers the credentials flow (whose `event_account_key` already equals `real_key`).
    pub async fn promote_pending_qr_session(&self, event_account_key: &str, real_key: &str) {
        let Some(process) = self.pending_qr.lock().await.remove(event_account_key) else {
            return;
        };
        // The other half of re-keying: this process's own reader tasks tag every event they emit
        // with whatever `process.rekey` last set, independent of which map key it lives under
        // here - see `AgentProcess::account_key`'s doc comment for why both halves are needed.
        process.rekey(real_key);

        let mut sessions = self.sessions.lock().await;
        // Mirrors `respawn`'s safety: an existing session at the real key (e.g. re-scanning an
        // account that's already signed in elsewhere in this app) must be killed, not leaked.
        if let Some(old) = sessions.remove(real_key) {
            old.kill().await;
        }
        sessions.insert(real_key.to_string(), process);
    }

    pub async fn submit_guard_code(&self, username: &str, code: String) -> AppResult<()> {
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;
        let response = process
            .send_request(move |id| IpcRequest::submit_guard_code(id, code))
            .await?;
        let result = ok_or_agent_error(response);
        match &result {
            Ok(()) => tracing::info!(account = %key, "agent guard code accepted"),
            Err(e) => tracing::warn!(account = %key, error = %e, "agent guard code rejected"),
        }
        result
    }

    /// Resumes a session using the refresh token saved for `username` (from a prior successful
    /// [`login`](Self::login)) - the token never crosses back out to the frontend, since Rust is
    /// the only side that ever needs it.
    pub async fn login_with_token(
        &self,
        app_handle: &AppHandle,
        username: String,
    ) -> AppResult<bool> {
        let key = Self::key_for(&username);

        // Serializes concurrent resume attempts for this same key - see `resume_locks`'s doc
        // comment. Held for the whole function body so a waiting second caller only proceeds once
        // the first has either logged on (making its own no-op check below true) or genuinely
        // failed (in which case retrying for real is correct).
        let lock = self.resume_lock(&key).await;
        let _resume_guard = lock.lock().await;

        // A session for this account can already be live and logged on here - the frontend calls
        // this on every app boot to resume a persisted session, but a live `AgentProcess` survives
        // a frontend-only reload (e.g. devtools refresh) even though the Rust process backing it
        // never restarted. Re-sending `login_with_token` to a bot that's already authenticated
        // doesn't no-op on the daemon side - `AuthFlow.LoginWithRefreshTokenAsync` calls
        // `SteamUser.LogOn` again regardless, which can fail/disconnect an otherwise-healthy
        // session for no reason. `steam_id()` is only ever `Some` while `status_changed` last
        // reported `loggedOn: true` (see `AgentProcess`/`handle_line`), so it's already an accurate
        // "currently logged on" signal - treat that as trivially already-resumed instead.
        if let Ok(existing) = self.existing(&key).await {
            if existing.steam_id().is_some() {
                return Ok(true);
            }
        }

        let settings = settings::load(app_handle).map_err(AppError::Agent)?;
        let saved_username = settings
            .agent_accounts
            .get(&key)
            .cloned()
            .ok_or(AppError::NoSavedAccount)?;

        let token_b64 =
            credential_store::load_refresh_token(&key)?.ok_or(AppError::NoSavedAccount)?;

        let process = self.get_or_spawn(app_handle, &key).await?;
        let response = process
            .send_request(move |id| IpcRequest::login_with_token(id, saved_username, token_b64))
            .await?;
        if response.ok {
            tracing::info!(account = %key, "agent session resumed via saved token");
            self.apply_saved_persona_state(app_handle, &key).await;
        } else {
            tracing::warn!(account = %key, "agent session resume via saved token failed");
        }
        Ok(response.ok)
    }

    /// Re-applies this account's saved persona state (see `presence_settings`) after a fresh
    /// (re)login. `PresenceManager` on the daemon side always defaults a freshly spawned process to
    /// `Online` (see `Daemon/Bot/PresenceManager.cs`) and only learns otherwise from an explicit
    /// `set_persona_state` call - without this, a user who set themselves to e.g. Offline would show
    /// as Online again after every app restart, since `login_with_token` spawns a brand new
    /// `SteamUtility.exe` process with no memory of the prior session's live-applied state. Best-
    /// effort: a lookup/apply failure here shouldn't fail the login itself, since the account is
    /// still usably logged on with the (harmless) default persona state.
    async fn apply_saved_persona_state(&self, app_handle: &AppHandle, key: &str) {
        let Ok(process) = self.existing(key).await else {
            return;
        };
        let Some(steam_id) = process.steam_id() else {
            tracing::warn!(account = %key, "skipping persona state re-apply: steam id not resolved after login");
            return;
        };

        let settings = match super::presence_settings::get(app_handle, &steam_id).await {
            Ok(settings) => settings,
            Err(e) => {
                tracing::warn!(account = %key, error = %e, "failed to read saved presence settings after login");
                return;
            }
        };

        let response = process
            .send_request(move |id| {
                IpcRequest::set_persona_state(id, settings.persona_state.as_wire_str())
            })
            .await;
        match response.and_then(ok_or_agent_error) {
            Ok(()) => {
                tracing::info!(account = %key, "agent persona state re-applied after login")
            }
            Err(e) => {
                tracing::warn!(account = %key, error = %e, "failed to re-apply persona state after login")
            }
        }
    }

    pub async fn logout(&self, username: &str) -> AppResult<()> {
        let key = Self::key_for(username);
        let process = {
            let mut sessions = self.sessions.lock().await;
            sessions.remove(&key).ok_or(AppError::SessionNotFound)?
        };

        let response = process.send_request(IpcRequest::logout).await;
        process.kill().await;

        let result = match response {
            Ok(r) => ok_or_agent_error(r),
            // The process is already gone by the time we tried to ask it to log out - that's the
            // end state we wanted anyway.
            Err(AppError::ProcessExited) => Ok(()),
            Err(e) => Err(e),
        };
        match &result {
            Ok(()) => tracing::info!(account = %key, "agent logged out"),
            Err(e) => tracing::warn!(account = %key, error = %e, "agent logout failed"),
        }
        result
    }

    /// The account's resolved SteamID64, learned from the daemon's `status_changed` event (see
    /// `AgentProcess::steam_id`) - fails with `AppError::AgentSteamIdUnknown` if the session exists
    /// but hasn't resolved one yet (e.g. still mid-login). `games::commands::get_owned_games` uses
    /// this to key the owned-games cache the same way CLI mode's already-known `steam_id` does.
    pub async fn steam_id(&self, username: &str) -> AppResult<String> {
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;
        process.steam_id().ok_or(AppError::AgentSteamIdUnknown)
    }

    /// Asks this account's live session for its full owned-games list via the daemon's
    /// `get_owned_apps` IPC command (PICS-based, no local Steam client needed - see
    /// `Daemon/Bot/OwnershipManager.cs`). No playtime here - that's `games::web_api`'s job, the
    /// same Steam Web API enrichment step CLI mode's ownership check also funnels through.
    ///
    /// `games_only` asks the daemon to keep only apps whose PICS `common.type` is `"Game"` (games
    /// + family-shared, no DLC/soundtracks/videos/tools) - not CLI mode's curated whitelist, which
    /// agent mode doesn't depend on for this; see `steam_agent::ownership_settings` (defaults to
    /// `true`; `false` opts into the unfiltered "all content" scope some users specifically want).
    ///
    /// Uses `OWNED_APPS_REQUEST_TIMEOUT` rather than the default `send_request` timeout - unlike
    /// every other command sent through this manager, PICS-based ownership resolution scales with
    /// the account's library size (thousands of individual PICS requests for a 5,000-10,000+ game
    /// library), so the standard fixed-cost timeout was firing on large libraries while the daemon
    /// was still legitimately working, not stuck.
    pub async fn get_owned_apps(
        &self,
        username: &str,
        games_only: bool,
    ) -> AppResult<Vec<crate::games::RawOwnedGame>> {
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;
        let response = process
            .send_request_with_timeout(
                |id| IpcRequest::get_owned_apps(id, games_only),
                OWNED_APPS_REQUEST_TIMEOUT,
            )
            .await?;

        if !response.ok {
            return Err(AppError::Agent(
                response
                    .error
                    .unwrap_or_else(|| "unknown_error".to_string()),
            ));
        }

        let games = response
            .result
            .as_ref()
            .and_then(|r| r.get("games"))
            .cloned()
            .unwrap_or(serde_json::Value::Array(Vec::new()));

        serde_json::from_value(games).map_err(AppError::from)
    }

    /// Replaces this account's currently-idling set via the daemon's `idle_set` command (fully
    /// replaces, not additive - see `Daemon/Bot/IdlingManager.cs`'s `SetGames`). `app_ids` should
    /// already be deduped/capped to 32 by the caller (`idling::cap_app_ids`) - the daemon does the
    /// identical dedup+cap itself, so this returns the same `app_ids` it was given straight back
    /// rather than waiting on the async `idle_state` event that follows the ack: that event isn't
    /// correlated to this request by id (see `AgentProcess::handle_line`), and since the daemon's
    /// computation is deterministic, waiting for it would only add latency, not correctness. The
    /// event still updates `AgentProcess::idle_app_ids` moments later for any subsequent
    /// `idle_state` call to read.
    ///
    /// `game_extra_info` is the account's saved custom idle-status text (see
    /// `presence_settings`) - only takes visible effect when `app_ids` is non-empty and contains a
    /// real, owned app id; the daemon silently ignores it otherwise.
    pub async fn set_idle_games(
        &self,
        username: &str,
        app_ids: Vec<u32>,
        game_extra_info: Option<String>,
    ) -> AppResult<Vec<u32>> {
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;
        let response = process
            .send_request({
                let app_ids = app_ids.clone();
                move |id| IpcRequest::idle_set(id, app_ids, game_extra_info)
            })
            .await?;
        ok_or_agent_error(response)?;
        Ok(app_ids)
    }

    /// Sets this account's persona state (Online/Away/Busy/...) via the daemon's
    /// `set_persona_state` command - see `Daemon/Bot/PresenceManager.cs`. A no-op from the daemon's
    /// perspective if the account isn't logged on yet; `PresenceManager` re-applies the
    /// last-commanded state on every subsequent (re)login within this process's lifetime, so a
    /// call made while mid-login still takes effect once login completes.
    pub async fn set_persona_state(
        &self,
        username: &str,
        persona_state: crate::steam_agent::presence_settings::PersonaState,
    ) -> AppResult<()> {
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;
        let response = process
            .send_request(move |id| IpcRequest::set_persona_state(id, persona_state.as_wire_str()))
            .await?;
        ok_or_agent_error(response)
    }

    /// This account's last-known idling set, as reported by the daemon's most recent `idle_state`
    /// event (see `AgentProcess::idle_app_ids`) - empty if `set_idle_games` has never been called
    /// for this session.
    pub async fn idle_state(&self, username: &str) -> AppResult<Vec<u32>> {
        let key = Self::key_for(username);
        Ok(self.existing(&key).await?.idle_app_ids())
    }

    /// Claims a free game via `free_games::store_claim`'s direct authenticated POST to Steam's own
    /// store checkout endpoint - no webview needed at all for agent mode, since [`get_web_session`]
    /// already mints fresh cookies on demand from the live SteamKit2 connection.
    ///
    /// **Deliberately never attempts SteamKit2's `RequestFreeLicense` opcode
    /// (`libs/SteamUtility/Daemon/Bot/FreeLicenseManager.cs`).** That opcode only grants genuine
    /// "Free on Demand" packages - and `free_games::discovery`'s scrape (see that module's doc
    /// comment) only ever surfaces ordinary paid games temporarily discounted to 100% off, never
    /// an evergreen Free-on-Demand title. So for every app id this feature can ever pass in here,
    /// `RequestFreeLicense` is a guaranteed no-op, confirmed against a real captured claim
    /// (`Result: OK`, both grant lists empty, in well under a second) - attempting it first would
    /// only add a wasted round trip to every claim and every hourly auto-redeem retry, never a real
    /// chance of success. The daemon's `request_free_license` IPC command itself is left in place
    /// (unused by this path) in case a genuinely distinct future feature needs real Free-on-Demand
    /// redemption.
    ///
    /// [`get_web_session`]: Self::get_web_session
    pub async fn claim_free_game(
        &self,
        app_handle: &AppHandle,
        username: &str,
        app_id: u32,
    ) -> AppResult<crate::free_games::FreeGameClaimOutcome> {
        use crate::free_games::{store_claim, FreeGameClaimCorrection};

        let app_handle_for_check = app_handle.clone();
        let username_for_check = username.to_string();
        // Always unfiltered (games_only: false) here regardless of the user's display-scope
        // setting - this is a real-ownership correctness check for an arbitrary promo app id
        // (which may not be a curated "real game"), not the owned-games list shown to the user.
        // Re-derives `AgentManager` from `app_handle` rather than capturing `self` directly so this
        // closure stays `'static` - it's reused for the pre-check, the post-claim confirmation, and
        // a potential detached background recheck (see `store_claim::claim_via_direct_post`).
        let check_owned: store_claim::OwnershipCheck = Arc::new(move || {
            let app_handle = app_handle_for_check.clone();
            let username = username_for_check.clone();
            Box::pin(async move {
                app_handle
                    .state::<AgentManager>()
                    .get_owned_apps(&username, false)
                    .await
                    .map(|games| games.iter().any(|game| game.app_id == app_id))
            })
        });

        let web_session = self.get_web_session(username).await?;
        let cookies = crate::steam_community::SteamCookies {
            sid: crate::steam_community::session::generate_session_id(),
            sls: web_session.steam_login_secure,
            sma: None,
        };
        let cookie_header = crate::steam_community::cookie_header("", &cookies);

        let correction = FreeGameClaimCorrection::Agent {
            username: username.to_string(),
            app_id,
        };

        store_claim::claim_via_direct_post(
            app_handle,
            username,
            app_id,
            &cookie_header,
            &cookies.sid,
            correction,
            check_owned,
        )
        .await
    }

    /// Fetches this account's achievement/stat data for `app_id` via the daemon's
    /// `achievements_get` command - see `Daemon/Bot/AchievementHandler.cs`. Fails with
    /// `unsupported_game_coordinator` for GC titles (440/570/730/550/620), a daemon-only
    /// restriction the CLI/local-client path doesn't share.
    ///
    /// `language` is a Steam schema language key (`"english"`, `"schinese"`, ...) - see
    /// `achievements::steam_language::steam_language_for_locale`.
    pub async fn achievements_get(
        &self,
        username: &str,
        app_id: u32,
        language: &'static str,
    ) -> AppResult<crate::achievements::AchievementData> {
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;
        let response = process
            .send_request(move |id| IpcRequest::achievements_get(id, app_id, language))
            .await?;

        let result = ok_or_agent_error_with_result(response)?;
        serde_json::from_value(result).map_err(AppError::from)
    }

    /// Unlocks or locks a single achievement via the daemon's `achievement_set` command.
    pub async fn set_achievement(
        &self,
        username: &str,
        app_id: u32,
        achievement_id: String,
        unlock: bool,
    ) -> AppResult<()> {
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;
        let response = process
            .send_request(move |id| IpcRequest::achievement_set(id, app_id, achievement_id, unlock))
            .await?;
        ok_or_agent_error(response)
    }

    /// Unlocks or locks every eligible achievement for `app_id` via the daemon's
    /// `achievement_set_bulk` command - one GetStats+StoreStats round trip for the whole batch
    /// (see `AchievementHandler.SetAchievementsBulkAsync`), matching CLI mode's equally-batched
    /// `SteamworksLocalBackend.SetAchievementsAsync`. Previously composed `achievement_set` per
    /// achievement in a loop, which made a ~50-achievement "unlock all" take 10-15s of real
    /// network round trips - `achievement_set_bulk` exists specifically so this call is O(1) IPC
    /// round trips instead of O(achievement count).
    pub async fn bulk_set_achievements(
        &self,
        username: &str,
        app_id: u32,
        unlock: bool,
    ) -> AppResult<crate::achievements::BulkAchievementResult> {
        use crate::achievements::BulkAchievementResult;

        // Only `id`/`achieved`/`protected_achievement` matter here, never display text, so the
        // schema language is irrelevant - always "english".
        let data = self.achievements_get(username, app_id, "english").await?;
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;

        let mut skipped = Vec::new();
        let mut changes = Vec::new();
        for achievement in data.achievements {
            if achievement.achieved == unlock || achievement.protected_achievement {
                skipped.push(achievement.id);
            } else {
                changes.push(AchievementChange {
                    id: achievement.id,
                    unlock,
                });
            }
        }

        if changes.is_empty() {
            return Ok(BulkAchievementResult {
                succeeded: Vec::new(),
                skipped,
                failed: Vec::new(),
            });
        }

        let response = process
            .send_request(move |id| IpcRequest::achievement_set_bulk(id, app_id, changes))
            .await?;
        let result = ok_or_agent_error_with_result(response)?;

        #[derive(Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct BulkSetResponse {
            succeeded: Vec<String>,
            failed: Vec<String>,
        }
        let parsed: BulkSetResponse = serde_json::from_value(result)?;

        Ok(BulkAchievementResult {
            succeeded: parsed.succeeded,
            skipped,
            failed: parsed.failed,
        })
    }

    /// Writes one or more plain numeric stats via the daemon's `stats_update` command.
    pub async fn update_stats(
        &self,
        username: &str,
        app_id: u32,
        stats: Vec<crate::achievements::StatUpdate>,
    ) -> AppResult<()> {
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;
        let response = process
            .send_request(move |id| IpcRequest::stats_update(id, app_id, stats))
            .await?;
        ok_or_agent_error(response)
    }

    /// Resets every stat/achievement-group for `app_id` to its schema default via the daemon's
    /// `stats_reset_all` command.
    pub async fn reset_all_stats(&self, username: &str, app_id: u32) -> AppResult<()> {
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;
        let response = process
            .send_request(move |id| IpcRequest::stats_reset_all(id, app_id))
            .await?;
        ok_or_agent_error(response)
    }

    /// Derives this account's Steam Community web session via the daemon's `get_web_session`
    /// command - see `Daemon/Bot/AuthFlow.cs::GetWebSessionAsync`. `card_farming::session`'s only
    /// caller: this is what lets a gamer-tier agent-mode account farm cards without ever showing a
    /// login prompt, unlike CLI mode's webview-based `session::acquire`.
    pub async fn get_web_session(&self, username: &str) -> AppResult<WebSession> {
        let key = Self::key_for(username);
        let process = self.existing(&key).await?;
        let response = process.send_request(IpcRequest::get_web_session).await?;
        let result = ok_or_agent_error_with_result(response)?;
        serde_json::from_value(result).map_err(AppError::from)
    }

    /// Kills every tracked agent session's process and forgets about all of them. Used by the
    /// pre-install update cleanup (see `updater::kill_all_steam_utility_processes`) - unlike
    /// `logout`, this doesn't ask SteamUtility to log off cleanly first, since an update install
    /// is about to replace the binary out from under it regardless.
    pub async fn kill_all(&self) {
        let mut sessions = self.sessions.lock().await;
        for (_, process) in sessions.drain() {
            process.kill().await;
        }
    }
}

fn parse_login_response(response: IpcResponse) -> AppResult<LoginOutcome> {
    if !response.ok {
        return Err(AppError::Agent(
            response.error.unwrap_or_else(|| "login_failed".to_string()),
        ));
    }

    let result = response.result.unwrap_or(serde_json::Value::Null);
    let status = result
        .get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("success");

    match status {
        "need_guard_code" => Ok(LoginOutcome::NeedGuardCode {
            guard_type: result
                .get("guardType")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string(),
            detail: result
                .get("detail")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string()),
        }),
        "need_guard_confirmation" => Ok(LoginOutcome::NeedGuardConfirmation),
        _ => Ok(LoginOutcome::Success),
    }
}

fn ok_or_agent_error(response: IpcResponse) -> AppResult<()> {
    if response.ok {
        Ok(())
    } else {
        Err(AppError::Agent(
            response
                .error
                .unwrap_or_else(|| "unknown_error".to_string()),
        ))
    }
}

fn ok_or_agent_error_with_result(response: IpcResponse) -> AppResult<serde_json::Value> {
    if response.ok {
        Ok(response.result.unwrap_or(serde_json::Value::Null))
    } else {
        Err(AppError::Agent(
            response
                .error
                .unwrap_or_else(|| "unknown_error".to_string()),
        ))
    }
}
