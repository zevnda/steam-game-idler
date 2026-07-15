use std::path::PathBuf;

use serde::Deserialize;
use serde_json::Value;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use crate::embedded_api_key;

/// Initializes structured logging for the app: human-readable lines to stderr in debug builds,
/// plus a rolling daily file under the app's log directory (both dev and release).
///
/// Defaults to `info` in **both** dev and release (not just dev) - this is the one log level
/// switch that intentionally isn't quieter in production. A user's bug report is only useful if
/// the informational lifecycle logging this app relies on for debugging (achievement unlocks,
/// card-farming decisions, idling state changes - see each feature module's own `tracing::info!`
/// calls) actually reaches their log file; filtering it out by default in release would make that
/// entire logging investment silently useless for the builds that matter most. `warn`/`error`-only
/// is still available for anyone who wants a quieter file via `STEAM_GAME_IDLER_LOG=warn`.
///
/// The returned `WorkerGuard` must be kept alive for the lifetime of the app - dropping it flushes
/// and closes the non-blocking file writer, so it's stashed in Tauri's managed state by the caller.
pub fn init(app_handle: &tauri::AppHandle) -> Result<WorkerGuard, Box<dyn std::error::Error>> {
    let log_dir = log_dir(app_handle)?;
    std::fs::create_dir_all(&log_dir)?;

    let file_appender = tracing_appender::rolling::daily(&log_dir, "steam-game-idler.log");
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    let filter =
        EnvFilter::try_from_env("STEAM_GAME_IDLER_LOG").unwrap_or_else(|_| EnvFilter::new("info"));

    let file_layer = fmt::layer()
        .with_writer(non_blocking)
        .with_ansi(false)
        .with_target(true);

    let registry = tracing_subscriber::registry().with(filter).with(file_layer);

    if cfg!(debug_assertions) {
        registry.with(fmt::layer().with_target(true)).init();
    } else {
        registry.init();
    }

    Ok(guard)
}

/// `pub(crate)` (not private) since `debug::commands` also needs to know where log files live, to
/// locate the current day's rotated file for the log viewer/reveal-in-Explorer/clear-logs commands.
///
/// Routed through `platform::logs_dir` (portable-aware: `<exe_dir>/logs` vs. `<app_data_dir>/
/// logs`), not Tauri's own `app_log_dir()` - the latter resolves to a *different* OS directory on
/// Windows (`dirs::data_local_dir()`, i.e. `%LOCALAPPDATA%`) than every other file this app writes,
/// and has no portable-mode awareness at all. Deliberately a *sibling* of `platform::cache_dir`,
/// not nested inside it, so `debug::commands::clear_all_cache_files` wiping the cache directory
/// can never race this module's permanently-open non-blocking file handle (unlike a one-shot
/// `OpenOptions::open` per write, `tracing_appender`'s writer holds its file open for the app's
/// whole lifetime, so deleting its containing directory out from under it is a real hazard `main`'s
/// log.txt - reopened every `log_event` call - never had).
pub(crate) fn log_dir(
    app_handle: &tauri::AppHandle,
) -> Result<PathBuf, Box<dyn std::error::Error>> {
    Ok(crate::platform::logs_dir(app_handle)?)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FrontendLogLevel {
    Error,
    Warn,
    Info,
}

/// JSON field names redacted wherever they appear (at any nesting depth) in a frontend-submitted
/// `context` object, matched case-insensitively with `_`/`-` stripped so `sessionId`, `session_id`
/// and `Session-Id` all match the same entry. Covers the dynamic secrets this app's frontend
/// actually handles: Steam Community session cookies (`sid`/`sls`/`sma`) and sign-in credentials.
/// Unlike backend `tracing` call sites (written by contributors who already know not to log a raw
/// secret), `context` here is arbitrary JSON any future frontend call site could pass without
/// thinking about it - redacting at
/// this boundary means a careless `logFrontendError('x', 'y', { cookies })` call can't leak one.
const REDACTED_FIELD_NAMES: &[&str] = &[
    "password",
    "sid",
    "sls",
    "sma",
    "cookie",
    "cookies",
    "token",
    "secret",
    "apikey",
    "guardcode",
    "authorization",
    "credential",
    "credentials",
];

fn is_redacted_field_name(key: &str) -> bool {
    let normalized: String = key.chars().filter(|c| c.is_alphanumeric()).collect();
    let normalized = normalized.to_lowercase();
    REDACTED_FIELD_NAMES.contains(&normalized.as_str())
}

fn redact_context(value: &mut Value) {
    match value {
        Value::Object(map) => {
            for (key, val) in map.iter_mut() {
                if is_redacted_field_name(key) {
                    *val = Value::String("<redacted>".to_string());
                } else {
                    redact_context(val);
                }
            }
        }
        Value::Array(items) => items.iter_mut().for_each(redact_context),
        _ => {}
    }
}

/// Defense in depth for the one static secret this app ships with (the embedded Steam Web API key,
/// see `embedded_api_key.rs`) - masks it if it appears verbatim in a frontend-submitted free-text
/// `message`, e.g. a raw failed-request URL string that included `?key=...` directly rather than
/// passing the key through structured `context`, where `redact_context` would already catch it.
fn mask_known_secrets(message: &str) -> String {
    match embedded_api_key::decode() {
        Some(key) if !key.is_empty() && message.contains(&key) => {
            message.replace(&key, "<redacted>")
        }
        _ => message.to_string(),
    }
}

/// Lets the frontend write into the same rolling log file the backend uses, so a user's bug report
/// (which points at this file, via the Debug tab's "reveal in Explorer") captures frontend activity
/// too, not just Rust-side events. Mirrors `main`'s `logEvent()` in spirit (a general-purpose event
/// logger every hook can call, for both real failures and notable non-error lifecycle events) but
/// with actual level/source structure instead of a free-text tag convention, and with the
/// redaction `main`'s equivalent never had for anything beyond one hardcoded key fragment.
///
/// Void return: logging must never itself fail visibly to the user, so there's nothing for the
/// frontend to handle beyond the fire-and-forget `invoke()` call already swallowing its own errors
/// (see `src/shared/utils/frontendLogging.ts`).
#[tauri::command]
pub fn log_frontend_event(
    level: FrontendLogLevel,
    source: String,
    message: String,
    context: Option<serde_json::Value>,
) {
    let message = mask_known_secrets(&message);
    let context = context.map(|mut ctx| {
        redact_context(&mut ctx);
        ctx
    });

    match level {
        FrontendLogLevel::Error => {
            tracing::error!(target: "frontend", source, ?context, "{message}")
        }
        FrontendLogLevel::Warn => {
            tracing::warn!(target: "frontend", source, ?context, "{message}")
        }
        FrontendLogLevel::Info => {
            tracing::info!(target: "frontend", source, ?context, "{message}")
        }
    }
}
