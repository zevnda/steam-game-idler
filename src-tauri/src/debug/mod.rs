//! Cross-cutting Debug-tab utility commands (log viewer/reveal/clear, settings file reveal, a
//! reset, a full cache-directory wipe, and basic system info for the settings export).
//!
//! There's no single per-account settings blob to reset here - settings are split across an
//! app-wide file and separate per-account, per-feature files - and logging goes through a real
//! `tracing`-backed daily-rolling log file, not a hand-rolled `log.txt`. `reveal_item_in_dir` (via
//! `tauri-plugin-opener`) replaces a raw `explorer /select,` shell-out
//! for the same "select this file in Explorer" behavior. `clear_all_cache_files` *is* a direct
//! equivalent of `main`'s `delete_all_cache_files`, since the on-disk cache directory shape
//! (`platform::cache_dir`) didn't need a redesign the way settings/logs did.

pub mod commands;
