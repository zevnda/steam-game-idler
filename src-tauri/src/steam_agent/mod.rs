//! Agent-mode (SteamKit2/daemon-backed) sign-in integration - spawns `libs/SteamUtility.exe agent`
//! per account and speaks its newline-delimited JSON IPC protocol (see
//! `libs/SteamUtility/Daemon/DaemonHost.cs`).

pub mod commands;
mod ipc;
mod manager;
pub mod ownership_settings;
mod playing;
pub mod presence_settings;
mod process;

pub use manager::AgentManager;
pub use playing::{is_playing_blocked, wait_while_playing_blocked};
pub use process::PlayingSession;
