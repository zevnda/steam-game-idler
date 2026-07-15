//! Agent-mode (SteamKit2/daemon-backed) sign-in integration - spawns `libs/SteamUtility.exe agent`
//! per account and speaks its newline-delimited JSON IPC protocol (see
//! `libs/SteamUtility/Daemon/DaemonHost.cs`).

pub mod commands;
mod ipc;
mod manager;
pub mod presence_settings;
mod process;

pub use manager::AgentManager;
