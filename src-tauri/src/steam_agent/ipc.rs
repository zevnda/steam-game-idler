use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::achievements::StatUpdate;

/// One `{id, unlock}` pair for the `achievement_set_bulk` command - mirrors
/// `SteamUtility.Daemon.Ipc.AchievementChangeRequest`'s wire shape exactly.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementChange {
    pub id: String,
    pub unlock: bool,
}

/// Outgoing request line, matching `SteamUtility.Daemon.Ipc.IpcRequest`'s field set
/// (`libs/SteamUtility/Daemon/Ipc/IpcMessage.cs`). SteamUtility deserializes with
/// `PropertyNameCaseInsensitive = true`, so the exact case here doesn't have to match the C#
/// PascalCase names - camelCase is used to match the envelope convention SteamUtility itself
/// emits on responses/events.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct IpcRequest {
    pub id: String,
    pub cmd: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pass_b64: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub refresh_token_b64: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_ids: Option<Vec<u32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub app_id: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub achievement_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unlock: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stats: Option<Vec<StatUpdate>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub achievement_changes: Option<Vec<AchievementChange>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub persona_state: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub game_extra_info: Option<String>,
}

impl IpcRequest {
    pub fn login(id: String, user: String, pass_b64: String) -> Self {
        Self {
            id,
            cmd: "login",
            user: Some(user),
            pass_b64: Some(pass_b64),
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: None,
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    /// Begins a QR sign-in session - no params, unlike `login`, since no username is known yet
    /// (see `AgentManager::begin_qr_login`'s doc comment for why the account key this process is
    /// spawned/tagged with is only a placeholder until the mobile app scan resolves one).
    pub fn begin_qr_login(id: String) -> Self {
        Self {
            id,
            cmd: "begin_qr_login",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: None,
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    pub fn login_with_token(id: String, user: String, refresh_token_b64: String) -> Self {
        Self {
            id,
            cmd: "login_with_token",
            user: Some(user),
            pass_b64: None,
            refresh_token_b64: Some(refresh_token_b64),
            code: None,
            app_ids: None,
            app_id: None,
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    pub fn submit_guard_code(id: String, code: String) -> Self {
        Self {
            id,
            cmd: "submit_guard_code",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: Some(code),
            app_ids: None,
            app_id: None,
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    pub fn logout(id: String) -> Self {
        Self {
            id,
            cmd: "logout",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: None,
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    /// Derives a Steam Community web session from the daemon's already-authenticated connection
    /// via the `get_web_session` command - see `Daemon/Bot/AuthFlow.cs::GetWebSessionAsync`. No
    /// params: the daemon mints it from whatever session/refresh-token it already holds.
    pub fn get_web_session(id: String) -> Self {
        Self {
            id,
            cmd: "get_web_session",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: None,
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    pub fn get_owned_apps(id: String) -> Self {
        Self {
            id,
            cmd: "get_owned_apps",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: None,
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    /// `idle_set` fully replaces the daemon's currently-idling set (not additive) - see
    /// `Daemon/Bot/IdlingManager.cs`'s `SetGames`. `app_ids` should already be deduped/capped to
    /// 32 via `idling::cap_app_ids` before this is called, since that's what the daemon itself
    /// does and this mirrors it client-side to compute a synchronous return value.
    ///
    /// `game_extra_info` replaces "Playing <game>" with custom text for friends, but only takes
    /// visible effect when `app_ids` is non-empty and contains a real, owned app id - see
    /// `presence_settings`'s module doc comment.
    pub fn idle_set(id: String, app_ids: Vec<u32>, game_extra_info: Option<String>) -> Self {
        Self {
            id,
            cmd: "idle_set",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: Some(app_ids),
            app_id: None,
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info,
        }
    }

    /// Sets the account's persona state (Online/Away/Busy/...) via the daemon's
    /// `set_persona_state` command - see `Daemon/Bot/PresenceManager.cs`. Freely settable any time
    /// post-login (confirmed live 2026-07-14 across Online/Busy/Snooze/Away).
    pub fn set_persona_state(id: String, persona_state: &'static str) -> Self {
        Self {
            id,
            cmd: "set_persona_state",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: None,
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: Some(persona_state),
            game_extra_info: None,
        }
    }

    /// Requests a free-license grant for `app_id` via the daemon's `request_free_license` command
    /// (SteamKit2's `SteamApps.RequestFreeLicense` - see
    /// `libs/SteamUtility/Daemon/Bot/FreeLicenseManager.cs`).
    pub fn request_free_license(id: String, app_id: u32) -> Self {
        Self {
            id,
            cmd: "request_free_license",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: Some(app_id),
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    /// Fetches this account's achievement/stat data for `app_id` via the daemon's
    /// `achievements_get` command - see `Daemon/Bot/AchievementHandler.cs`. Throws
    /// `unsupported_game_coordinator` for GC titles (440/570/730/550/620), a daemon-only
    /// restriction the CLI/local-client path doesn't share.
    pub fn achievements_get(id: String, app_id: u32) -> Self {
        Self {
            id,
            cmd: "achievements_get",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: Some(app_id),
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    /// Unlocks or locks a single achievement via the daemon's `achievement_set` command - no
    /// separate toggle verb exists on this path (see `Daemon/DaemonHost.cs`), so the caller always
    /// passes an explicit `unlock` flag.
    pub fn achievement_set(id: String, app_id: u32, achievement_id: String, unlock: bool) -> Self {
        Self {
            id,
            cmd: "achievement_set",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: Some(app_id),
            achievement_id: Some(achievement_id),
            unlock: Some(unlock),
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    /// Unlocks or locks every achievement in `changes` via the daemon's `achievement_set_bulk`
    /// command - one GetStats+StoreStats round trip for the whole batch (see
    /// `AchievementHandler.SetAchievementsBulkAsync`), unlike composing [`Self::achievement_set`]
    /// per achievement, which is what previously made a bulk unlock/lock take 10-15s.
    pub fn achievement_set_bulk(id: String, app_id: u32, changes: Vec<AchievementChange>) -> Self {
        Self {
            id,
            cmd: "achievement_set_bulk",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: Some(app_id),
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: Some(changes),
            persona_state: None,
            game_extra_info: None,
        }
    }

    /// Writes one or more plain numeric stats via the daemon's `stats_update` command.
    pub fn stats_update(id: String, app_id: u32, stats: Vec<StatUpdate>) -> Self {
        Self {
            id,
            cmd: "stats_update",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: Some(app_id),
            achievement_id: None,
            unlock: None,
            stats: Some(stats),
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }

    /// Resets every plain stat and achievement-group stat for `app_id` to its schema default via
    /// the daemon's `stats_reset_all` command - see `AchievementHandler.ResetAllStatsAsync`.
    pub fn stats_reset_all(id: String, app_id: u32) -> Self {
        Self {
            id,
            cmd: "stats_reset_all",
            user: None,
            pass_b64: None,
            refresh_token_b64: None,
            code: None,
            app_ids: None,
            app_id: Some(app_id),
            achievement_id: None,
            unlock: None,
            stats: None,
            achievement_changes: None,
            persona_state: None,
            game_extra_info: None,
        }
    }
}

/// One deserialized line from SteamUtility's stdout. `SteamUtility.Core.Json.JsonEnvelope` writes
/// either `{id?, ok, result|error}` (a response) or `{event, ...payload flattened}` (an event) -
/// `extra` catches an event's flattened payload fields; a response never has any (its payload is
/// nested under `result`).
#[derive(Debug, Clone, Deserialize)]
pub struct IpcMessage {
    pub id: Option<String>,
    pub ok: Option<bool>,
    pub result: Option<Value>,
    pub error: Option<String>,
    pub event: Option<String>,
    #[serde(flatten)]
    pub extra: HashMap<String, Value>,
}

#[derive(Debug, Clone)]
pub enum IpcLine {
    Response {
        id: Option<String>,
        ok: bool,
        result: Option<Value>,
        error: Option<String>,
    },
    Event {
        name: String,
        payload: HashMap<String, Value>,
    },
}

impl IpcMessage {
    pub fn classify(self) -> IpcLine {
        match self.event {
            Some(name) => {
                // `error`/`result`/`ok` are named fields above, so `#[serde(flatten)] extra`
                // never sees a JSON key with one of those names - serde routes it to the named
                // field instead, even for an event whose payload happens to use that name (e.g.
                // `login_failed`'s `{ error }`, `status_changed`'s `result`). Reinsert them so
                // event payloads carry every field SteamUtility actually sent; a response never
                // reaches this branch so there's no ambiguity with their response-shaped meaning.
                let mut payload = self.extra;
                if let Some(error) = self.error {
                    payload.insert("error".to_string(), Value::String(error));
                }
                if let Some(result) = self.result {
                    payload.insert("result".to_string(), result);
                }
                if let Some(ok) = self.ok {
                    payload.insert("ok".to_string(), Value::Bool(ok));
                }
                IpcLine::Event { name, payload }
            }
            None => IpcLine::Response {
                id: self.id,
                ok: self.ok.unwrap_or(false),
                result: self.result,
                error: self.error,
            },
        }
    }
}

#[derive(Debug, Clone)]
pub struct IpcResponse {
    pub ok: bool,
    pub result: Option<Value>,
    pub error: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    // Regression test for a real bug: `login_failed`'s `{ error }` payload and
    // `status_changed`'s `result` field used to vanish silently, because `error`/`result`/`ok`
    // are named `IpcMessage` fields and serde's `#[serde(flatten)] extra` never routes a
    // matching JSON key there - see `classify`'s doc comment.
    #[test]
    fn event_payload_recovers_error_field() {
        let message: IpcMessage =
            serde_json::from_str(r#"{"event":"login_failed","error":"Failed to poll status with result Expired."}"#)
                .unwrap();
        let IpcLine::Event { name, payload } = message.classify() else {
            panic!("expected an event line");
        };
        assert_eq!(name, "login_failed");
        assert_eq!(
            payload.get("error").and_then(|v| v.as_str()),
            Some("Failed to poll status with result Expired.")
        );
    }

    #[test]
    fn event_payload_recovers_result_field() {
        let message: IpcMessage = serde_json::from_str(
            r#"{"event":"status_changed","result":"Reconnecting","steamId":null}"#,
        )
        .unwrap();
        let IpcLine::Event { name, payload } = message.classify() else {
            panic!("expected an event line");
        };
        assert_eq!(name, "status_changed");
        assert_eq!(payload.get("result").and_then(|v| v.as_str()), Some("Reconnecting"));
    }

    #[test]
    fn response_line_still_uses_named_fields() {
        let message: IpcMessage =
            serde_json::from_str(r#"{"id":"1","ok":false,"error":"logon_failed:InvalidPassword"}"#)
                .unwrap();
        let IpcLine::Response { id, ok, error, .. } = message.classify() else {
            panic!("expected a response line");
        };
        assert_eq!(id.as_deref(), Some("1"));
        assert!(!ok);
        assert_eq!(error.as_deref(), Some("logon_failed:InvalidPassword"));
    }
}
