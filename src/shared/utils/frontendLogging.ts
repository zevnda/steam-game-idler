import { invoke } from '@tauri-apps/api/core'

type FrontendLogLevel = 'error' | 'warn' | 'info'

// Writes into the same rolling log file the backend's `tracing` setup owns (see
// src-tauri/src/logging.rs's `log_frontend_event`, which also handles redacting known-sensitive
// `context` fields), so a user's bug report - which points at that file via the Debug tab's
// "reveal in Explorer" - captures frontend activity too. `source` is a short call-site tag (a
// hook/component name), not a full stack trace, to match the backend's own `"<module>: <event>"`
// log-line convention.
const logToBackend = (
  level: FrontendLogLevel,
  source: string,
  message: string,
  context?: Record<string, unknown>,
) => {
  invoke('log_frontend_event', { level, source, message, context: context ?? null }).catch(() => {
    // Logging must never itself throw or surface to the user - if the backend call fails (e.g.
    // during app shutdown), silently drop it rather than compounding the original error.
  })
}

export const logFrontendError = (
  source: string,
  message: string,
  context?: Record<string, unknown>,
) => logToBackend('error', source, message, context)

export const logFrontendWarn = (
  source: string,
  message: string,
  context?: Record<string, unknown>,
) => logToBackend('warn', source, message, context)

// For notable, non-error lifecycle events worth having in a bug report even when nothing actually
// failed (e.g. "claimed free game X", "switched active account").
export const logFrontendInfo = (
  source: string,
  message: string,
  context?: Record<string, unknown>,
) => logToBackend('info', source, message, context)
