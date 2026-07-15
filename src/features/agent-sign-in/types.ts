// Mirrors `LoginOutcome` in src-tauri/src/steam_agent/manager.rs (serde `tag = "status"`,
// `rename_all = "camelCase"`).
export type LoginOutcome =
  | { status: 'success' }
  | { status: 'needGuardCode'; guardType: string; detail: string | null }
  | { status: 'needGuardConfirmation' }

// Mirrors `QrChallenge` in src-tauri/src/steam_agent/manager.rs (serde `rename_all =
// "camelCase"`). `sessionKey` is an opaque placeholder, not a normalized username - see that
// struct's doc comment.
export interface QrChallenge {
  sessionKey: string
  challengeUrl: string
}

// Payload shape of the `steam-agent-event` Tauri event emitted by
// src-tauri/src/steam_agent/process.rs::handle_line - one channel for every SteamUtility async
// event, distinguished by `event` rather than a dedicated Tauri event name per event type.
export interface AgentEventPayload {
  account: string
  event: string
  payload: Record<string, unknown>
}

export const AGENT_EVENT_NAME = 'steam-agent-event'
