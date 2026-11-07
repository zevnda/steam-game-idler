//! Changes to what the *user* owns - no elevation needed. The autostart value and taskbar pins are
//! re-pointed on every startup, so they also cover a user who never agrees to (or can't approve)
//! the elevated cleanup. The per-user shortcuts are created once the old ones are gone, or when the
//! user opts out of the cleanup (see `commands`).

use std::path::Path;

use windows::Win32::UI::Shell::{FOLDERID_Desktop, FOLDERID_Programs, FOLDERID_RoamingAppData};
use windows_registry::CURRENT_USER;

use super::detect::is_not_found;
use super::paths::{autostart_run_value, run_value_exe, should_repoint};
use super::shell_link::{self, known_folder};
use super::{IDENTIFIER, PRODUCT_NAME};

const RUN_KEY: &str = r"Software\Microsoft\Windows\CurrentVersion\Run";

/// Where Windows keeps the shortcut behind each pin, under `%APPDATA%`. `StartMenu` only matters
/// for the Windows 7-era Start menu; Windows 10/11 Start pins live elsewhere and aren't touched.
const PIN_FOLDERS: &[&str] = &[
    r"Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar",
    r"Microsoft\Internet Explorer\Quick Launch\User Pinned\StartMenu",
];

/// The HKCU autostart value (written by tauri-plugin-autostart with the exe path it ran from when
/// the user turned autostart on) still naming the old exe would launch the old copy at every
/// login, which would then re-download and re-install this one. Only the Run value is rewritten -
/// never `StartupApproved\Run`: going through the plugin's `enable()` would also mark the entry
/// enabled there, silently re-enabling an entry the user disabled in Task Manager.
pub(super) fn repoint_autostart(current_exe: &Path, legacy_exe: Option<&Path>) {
    let key = CURRENT_USER.options().read().write().open(RUN_KEY);
    if is_not_found(&key) {
        return;
    }
    let key = match key {
        Ok(key) => key,
        Err(e) => {
            tracing::warn!(error = %e, "legacy_install: couldn't open the autostart registry key");
            return;
        }
    };

    // No value at all is the normal "autostart off" state.
    let Ok(value) = key.get_string(PRODUCT_NAME) else {
        return;
    };
    let Some(target) = run_value_exe(&value) else {
        return;
    };
    if !should_repoint(&target, current_exe, legacy_exe, target.exists()) {
        return;
    }

    match key.set_string(PRODUCT_NAME, autostart_run_value(current_exe)) {
        Ok(()) => tracing::info!(
            from = %target.display(),
            to = %current_exe.display(),
            "legacy_install: re-pointed autostart at this install"
        ),
        Err(e) => tracing::warn!(
            error = %e,
            from = %target.display(),
            "legacy_install: couldn't re-point autostart at this install"
        ),
    }
}

/// Creates the HKCU autostart value for this exe if there's none - for a user whose only autostart
/// entry was the machine-wide one the elevated cleanup just removed. `StartupApproved` is left
/// alone, so a Task Manager "disabled" state the user set for it still applies.
pub(super) fn ensure_autostart(current_exe: &Path) {
    let key = match CURRENT_USER.create(RUN_KEY) {
        Ok(key) => key,
        Err(e) => {
            tracing::warn!(error = %e, "legacy_install: couldn't open the autostart registry key");
            return;
        }
    };
    if key.get_string(PRODUCT_NAME).is_ok() {
        return;
    }
    match key.set_string(PRODUCT_NAME, autostart_run_value(current_exe)) {
        Ok(()) => tracing::info!(
            exe = %current_exe.display(),
            "legacy_install: moved the machine-wide autostart entry to this account"
        ),
        Err(e) => tracing::warn!(error = %e, "legacy_install: couldn't create the autostart entry"),
    }
}

/// Re-points the user's pins at this exe, so a pinned icon keeps working once the old exe is gone
/// - Windows won't let an app pin itself, so a removed pin would be the user's to redo. Needs COM
/// initialized on the calling thread.
pub(super) fn retarget_pins(current_exe: &Path, legacy_exe: Option<&Path>) {
    let Some(appdata) = known_folder(&FOLDERID_RoamingAppData) else {
        return;
    };
    for folder in PIN_FOLDERS {
        let Ok(entries) = std::fs::read_dir(appdata.join(folder)) else {
            continue;
        };
        for path in entries.filter_map(|entry| entry.ok().map(|e| e.path())) {
            if !path
                .extension()
                .is_some_and(|ext| ext.eq_ignore_ascii_case("lnk"))
            {
                continue;
            }
            let Some(target) = shell_link::target(&path) else {
                continue;
            };
            if !should_repoint(&target, current_exe, legacy_exe, target.exists()) {
                continue;
            }
            match shell_link::retarget(&path, &target, current_exe) {
                Ok(()) => tracing::info!(
                    pin = %path.display(),
                    from = %target.display(),
                    "legacy_install: re-pointed a pin at this install"
                ),
                Err(e) => tracing::warn!(
                    error = %e,
                    pin = %path.display(),
                    "legacy_install: couldn't re-point a pin at this install"
                ),
            }
        }
    }
}

/// Creates the per-user Start Menu shortcut (and a Desktop one when `desktop`) unless one already
/// exists, the way Tauri's installer would have on a fresh install: same name, target, working
/// directory and AppUserModelID - so the per-user uninstaller recognises and removes them, and
/// Windows keeps showing the app's notifications (it requires a Start Menu shortcut carrying the
/// toast's AppUserModelID). Needs COM initialized on the calling thread.
pub(super) fn create_user_shortcuts(current_exe: &Path, desktop: bool) {
    let folders = [(FOLDERID_Programs, true), (FOLDERID_Desktop, desktop)];
    for (folder_id, _) in folders.iter().filter(|(_, wanted)| *wanted) {
        let Some(folder) = known_folder(folder_id) else {
            continue;
        };
        let shortcut = folder.join(format!("{PRODUCT_NAME}.lnk"));
        if shortcut.exists() {
            continue;
        }
        match shell_link::create(&shortcut, current_exe, IDENTIFIER) {
            Ok(()) => tracing::info!(
                shortcut = %shortcut.display(),
                "legacy_install: created a shortcut for this install"
            ),
            Err(e) => tracing::warn!(
                error = %e,
                shortcut = %shortcut.display(),
                "legacy_install: couldn't create a shortcut for this install"
            ),
        }
    }
}
