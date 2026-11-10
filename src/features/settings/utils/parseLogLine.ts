export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE'

export interface ParsedLogLine {
  // Null when the line isn't in `tracing`'s format (see below) - the raw text then lands in
  // `message` alone, so nothing is ever hidden from the viewer.
  timestamp: Date | null
  level: LogLevel | null
  source: string | null
  message: string
}

// One line of `tracing_subscriber::fmt`'s default (non-ANSI, `with_target(true)`) format, as
// configured in src-tauri/src/logging.rs:
//   2026-11-10T04:28:26.588506Z  INFO steam_game_idler_lib::idling::claims: idling: claim updated ...
// The level is right-padded to 5 chars, hence `\s+`. If logging.rs's layer config changes (e.g.
// a custom timer or `with_target(false)`), this regex must change with it - lines would otherwise
// fall through to the unparsed fallback rather than break.
const TRACING_LINE = /^(\S+)\s+(ERROR|WARN|INFO|DEBUG|TRACE)\s+([^\s:]+(?:::[^\s:]+)*):\s?(.*)$/

const CRATE_PREFIX = 'steam_game_idler_lib::'

// `log_frontend_event` (logging.rs) records the calling hook as a `source="..."` field right after
// the message. Pulled out into the source column so frontend lines read like backend ones
// ("frontend · useIdling") instead of burying the useful part at the end of the message.
const FRONTEND_SOURCE_FIELD = / source="([^"]*)"/

export function parseLogLine(line: string) {
  const match = TRACING_LINE.exec(line)
  if (!match) {
    const unparsed: ParsedLogLine = { timestamp: null, level: null, source: null, message: line }
    return unparsed
  }

  const [, rawTimestamp, level, target, rest] = match
  const parsedDate = new Date(rawTimestamp)
  const timestamp = Number.isNaN(parsedDate.getTime()) ? null : parsedDate

  // The crate prefix is identical on every backend line, so it's pure noise in a narrow column.
  let source = target.startsWith(CRATE_PREFIX) ? target.slice(CRATE_PREFIX.length) : target
  let message = rest

  if (target === 'frontend') {
    const sourceMatch = FRONTEND_SOURCE_FIELD.exec(message)
    if (sourceMatch) {
      source = `frontend · ${sourceMatch[1]}`
      message = message.replace(sourceMatch[0], '')
    }
    // `context=None` is `Option`'s Debug output for a call with no context - says nothing.
    message = message.replace(/ context=None$/, '')
  }

  const parsed: ParsedLogLine = { timestamp, level: level as LogLevel, source, message }
  return parsed
}
