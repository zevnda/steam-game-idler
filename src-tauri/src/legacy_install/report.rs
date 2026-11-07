//! What the elevated cleanup did, handed back to the normal process as a JSON file. The elevated
//! process can't log: it may run as a different Windows account (a standard user approving with
//! an admin's password), and it mustn't write to the open log file alongside the main process. So
//! it only records outcomes here, and the main process logs them (`commands::finish_cleanup`).

use std::path::Path;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) enum CleanupOutcome {
    /// Everything known was removed, the folders included.
    Removed,
    /// The registry entries and shortcuts are gone, but files remain: some are in use (deleted at
    /// the next reboot) or the folder holds files SGI didn't install (left alone).
    RemovedWithLeftovers,
    /// No per-machine install was registered (already cleaned up, or never existed).
    NotFound,
    /// A known file could be neither deleted nor scheduled for deletion, so the registry entries
    /// were kept and the cleanup will be offered again.
    Failed,
}

#[derive(Debug, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct CleanupReport {
    pub outcome: Option<CleanupOutcome>,
    pub install_dir: Option<String>,
    pub same_folder: bool,
    /// How many known files were deleted outright (listing all ~90 would drown the log).
    pub deleted_file_count: usize,
    pub scheduled_for_reboot: Vec<String>,
    /// `path: error` for known files that could be neither deleted nor scheduled.
    pub failed: Vec<String>,
    /// Entries left in the install folder that SGI didn't install.
    pub left_behind: Vec<String>,
    pub removed_dirs: Vec<String>,
    pub removed_shortcuts: Vec<String>,
    pub removed_registry_keys: Vec<String>,
    /// An all-users Desktop shortcut to the old exe was removed, so the user gets a per-user one.
    pub removed_desktop_shortcut: bool,
    /// An *enabled* HKLM autostart entry for the old exe was removed (only possible if SGI was once
    /// run as administrator), so the user gets an HKCU one for this copy instead.
    pub removed_machine_autostart: bool,
    /// Non-fatal problems worth a log line (a registry key that wouldn't delete, ...).
    pub warnings: Vec<String>,
}

impl CleanupReport {
    pub fn read(path: &Path) -> Result<Self, String> {
        let contents = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        serde_json::from_str(&contents).map_err(|e| e.to_string())
    }

    /// Written to a temp name and renamed into place, so the main process (which may pick the
    /// file up at its next startup) never reads a half-written report. The temp file is opened
    /// with `create_new`: this runs elevated in a user-writable folder, and a link planted at the
    /// temp name must make the write fail rather than be followed somewhere else.
    pub fn write(&self, path: &Path) -> Result<(), String> {
        use std::io::Write;

        let json = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        let temp = path.with_extension("json.tmp");
        let _ = std::fs::remove_file(&temp);
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temp)
            .map_err(|e| e.to_string())?;
        file.write_all(json.as_bytes()).map_err(|e| e.to_string())?;
        drop(file);
        std::fs::rename(&temp, path).map_err(|e| e.to_string())
    }
}
