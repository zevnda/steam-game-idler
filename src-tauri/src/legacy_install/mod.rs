//! Cleans up the per-machine (Program Files) install left behind by the switch to per-user
//! installs (GitHub issue #2273).
//!
//! Up to 6.4.x the NSIS installer was `perMachine`: `C:\Program Files\Steam Game Idler`, HKLM
//! registration and all-users shortcuts, so every auto-update needed a UAC prompt - which an
//! autostarted, hidden SGI could only show as a flashing taskbar button nobody was watching. The
//! installer is now `currentUser` (`tauri.conf.json`): `%LOCALAPPDATA%\Steam Game Idler`, HKCU,
//! per-user shortcuts, and no UAC prompt for any later update.
//!
//! An old per-machine build updates to a per-user build without a prompt (the new installer runs
//! as the user), but the new installer only reads HKCU, so it never sees the old copy. Left behind:
//! the Program Files folder, its HKLM uninstall entry (a second "Steam Game Idler" in Installed
//! apps), `HKLM\Software\zevnda\Steam Game Idler`, and the all-users Start Menu / Public Desktop
//! shortcuts. Those shortcuts keep launching the old exe, which then "updates" - re-downloads and
//! re-installs the per-user build - on every launch. The user's autostart value and taskbar pins
//! also still point at the old exe.
//!
//! What this module does about it:
//! - Every startup, no elevation ([`user_fixups`]): re-points the HKCU autostart value and the
//!   user's taskbar pins from the old exe to this one.
//! - When the user agrees (`LegacyInstallPrompt.tsx`): relaunches this exe elevated with
//!   [`elevated::FLAG`]. That process ([`elevated`]) removes the machine-wide leftovers and exits.
//!   Program Files and HKLM can't be changed without admin rights, so this is the one UAC prompt
//!   left - and it's shown right after a click, as a real dialog rather than a taskbar shield.
//! - Afterwards, back in the normal process ([`commands`]): logs the elevated run's report and
//!   creates the per-user Start Menu (and Desktop) shortcuts the update never made. Tauri's NSIS
//!   template skips shortcut creation in `/UPDATE` mode, and the updater always passes `/UPDATE`.
//!   The Start Menu one matters beyond launching: tauri-plugin-notification tags toasts with the
//!   app identifier, and Windows only shows them when a Start Menu shortcut carries that ID.
//!
//! Deliberately not done:
//! - Running the old `uninstall.exe`. Without `/UPDATE` it deletes the `HKCU\...\Run` autostart
//!   value the new install shares (turning autostart off); with it, it leaves the shortcuts. And
//!   uninstallers built before 6.2.9 (Tauri CLI 2.11.x) look for the running app by process *name*,
//!   so they'd offer to kill this copy.
//! - Killing processes. `updater::kill_all_steam_utility_processes` matches by name and would take
//!   this copy's SteamUtility processes - the user's running automation - with it. A file still in
//!   use is scheduled for deletion at the next reboot instead.

pub mod commands;

#[cfg(any(windows, test))]
mod known_files;
#[cfg(any(windows, test))]
mod paths;

#[cfg(windows)]
mod detect;
#[cfg(windows)]
mod elevated;
#[cfg(windows)]
mod report;
#[cfg(windows)]
mod shell_link;
#[cfg(windows)]
mod user_fixups;

#[cfg(windows)]
pub use elevated::run_from_args as run_elevated_task_from_args;

/// `tauri.conf.json`'s `productName`. Also the name of the old install folder, its uninstall key,
/// its shortcuts, and the autostart value (tauri-plugin-autostart names it after
/// `package_info().name`, which is the product name). Hardcoded rather than read from the Tauri
/// config because the elevated process runs before (and without) any Tauri context - the tests
/// below check these constants against `tauri.conf.json` so they can't drift.
#[cfg(any(windows, test))]
pub(crate) const PRODUCT_NAME: &str = "Steam Game Idler";

/// `mainBinaryName` plus `.exe` - the main exe's file name in every install.
#[cfg(any(windows, test))]
pub(crate) const MAIN_EXE_NAME: &str = "Steam Game Idler.exe";

/// The NSIS template's `MANUFACTURER`: with no `publisher` configured, Tauri's bundler uses the
/// identifier's second segment. Names `HKLM\Software\zevnda` and the uninstall entry's Publisher.
#[cfg(any(windows, test))]
pub(crate) const MANUFACTURER: &str = "zevnda";

/// The bundle identifier - the AppUserModelID Tauri's installer stamps on the shortcuts it creates
/// (and the one tauri-plugin-notification uses), so shortcuts made here must carry it too.
#[cfg(any(windows, test))]
pub(crate) const IDENTIFIER: &str = "com.zevnda.steam-game-idler";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constants_match_tauri_conf() {
        let conf: serde_json::Value =
            serde_json::from_str(include_str!("../../tauri.conf.json")).unwrap();
        assert_eq!(conf["productName"], PRODUCT_NAME);
        assert_eq!(
            format!("{}.exe", conf["mainBinaryName"].as_str().unwrap()),
            MAIN_EXE_NAME
        );
        assert_eq!(conf["identifier"], IDENTIFIER);
        assert_eq!(IDENTIFIER.split('.').nth(1), Some(MANUFACTURER));
        // A configured publisher would replace the identifier-derived manufacturer above.
        assert!(conf["bundle"]["publisher"].is_null());
    }
}
