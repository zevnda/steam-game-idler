//! The elevated half of the cleanup: `Steam Game Idler.exe --remove-legacy-install --result-file
//! <path>`, launched through a UAC prompt by [`super::commands`]. `main()` dispatches here before
//! anything else - before Tauri, its plugins, and in particular tauri-plugin-single-instance, which
//! would see the running copy and hand this launch over to it instead of running it. No window,
//! tray, webview or logger is ever created.
//!
//! Its input is treated as untrusted. The command line only says where to write the report, and
//! that must be named [`super::paths::RESULT_FILE_NAME`]; what to delete comes from HKLM, read here,
//! and only file names from [`super::known_files`] are deleted, never through a junction or symlink.
//!
//! It may run as a different Windows account than the user (a standard user approving with an
//! admin's password), so it only touches machine-wide things - the old install folder, HKLM, and
//! the all-users Start Menu and Public Desktop - never HKCU or anyone's profile.
//!
//! Every step is safe to repeat: whatever is already gone is skipped, and the uninstall entry that
//! detection keys off is deleted last, so an interrupted or failed run is simply offered again.

use std::collections::HashSet;
use std::os::windows::fs::MetadataExt;
use std::path::{Path, PathBuf};

use windows::core::{HSTRING, PCWSTR};
use windows::Win32::Storage::FileSystem::{MoveFileExW, MOVEFILE_DELAY_UNTIL_REBOOT};
use windows::Win32::System::Registry::KEY_WOW64_64KEY;
use windows::Win32::UI::Shell::{
    FOLDERID_CommonPrograms, FOLDERID_ProgramData, FOLDERID_ProgramFiles, FOLDERID_ProgramFilesX86,
    FOLDERID_Public, FOLDERID_PublicDesktop, FOLDERID_System, FOLDERID_SystemX86,
    FOLDERID_UserProfiles, FOLDERID_Windows,
};
use windows_registry::LOCAL_MACHINE;

use super::detect::{self, is_not_found, manufacturer_key, product_key, uninstall_key};
use super::known_files::{LIBS, LIBS_DIR, ROOT};
use super::paths::{
    comparable, dirs_overlap, is_plausible_install_dir, is_valid_result_path, run_value_exe,
    same_path,
};
use super::report::{CleanupOutcome, CleanupReport};
use super::shell_link::{self, known_folder, ComApartment};
use super::PRODUCT_NAME;

pub(super) const FLAG: &str = "--remove-legacy-install";
pub(super) const RESULT_FILE_ARG: &str = "--result-file";

/// `FILE_ATTRIBUTE_REPARSE_POINT`: a junction, symlink or other redirect.
const FILE_ATTRIBUTE_REPARSE_POINT: u32 = 0x400;

const RUN_KEY: &str = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Run";
const STARTUP_APPROVED_RUN_KEY: &str =
    r"SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run";

/// Exit codes - the main process's fallback when the report file is missing or unreadable.
pub(super) mod exit_code {
    pub const REMOVED: u32 = 0;
    pub const REMOVED_WITH_LEFTOVERS: u32 = 1;
    pub const NOT_FOUND: u32 = 2;
    pub const FAILED: u32 = 3;
    pub const BAD_ARGS: u32 = 4;
}

/// `Some(exit code)` when this process was launched as the elevated cleanup (`main()` exits with
/// it right away), `None` for a normal launch.
pub fn run_from_args() -> Option<i32> {
    let mut args = std::env::args_os().skip(1);
    if args.next()? != FLAG {
        return None;
    }

    let result_path = match (args.next(), args.next(), args.next()) {
        (Some(flag), Some(path), None) if flag == RESULT_FILE_ARG => PathBuf::from(path),
        _ => return Some(exit_code::BAD_ARGS as i32),
    };
    if !is_valid_result_path(&result_path) || !result_path.parent().is_some_and(Path::is_dir) {
        return Some(exit_code::BAD_ARGS as i32);
    }

    let report = cleanup();
    let code = match report.outcome {
        Some(CleanupOutcome::Removed) => exit_code::REMOVED,
        Some(CleanupOutcome::RemovedWithLeftovers) => exit_code::REMOVED_WITH_LEFTOVERS,
        Some(CleanupOutcome::NotFound) => exit_code::NOT_FOUND,
        Some(CleanupOutcome::Failed) | None => exit_code::FAILED,
    };
    // Nowhere to report a failed write from here - the exit code still carries the outcome.
    let _ = report.write(&result_path);
    Some(code as i32)
}

fn cleanup() -> CleanupReport {
    let mut report = CleanupReport::default();

    let current_exe_dir = std::env::current_exe()
        .ok()
        .and_then(|exe| exe.parent().map(Path::to_path_buf));
    let Some(install) = detect::detect(current_exe_dir.as_deref()) else {
        report.outcome = Some(CleanupOutcome::NotFound);
        return report;
    };
    report.install_dir = install.dir.as_ref().map(|dir| dir.display().to_string());
    // The running copy's files must never be touched - a locked exe would be scheduled for deletion
    // at reboot, taking the new install with it. So resolved paths are compared too (a short 8.3
    // spelling of the same folder can slip past a plain comparison), nesting either way counts, and
    // not knowing this copy's folder counts as overlapping.
    let spares_this_install = install.same_folder
        || match (install.dir.as_deref(), current_exe_dir.as_deref()) {
            (Some(dir), Some(current)) => {
                dirs_overlap(dir, current)
                    || matches!(
                        (std::fs::canonicalize(dir), std::fs::canonicalize(current)),
                        (Ok(dir), Ok(current)) if dirs_overlap(&dir, &current)
                    )
            }
            (Some(_), None) => true,
            (None, _) => false,
        };
    report.same_folder = spares_this_install;

    let _com = ComApartment::init();

    // Shortcuts and autostart first, while the old exe they're matched against still exists.
    if let Some(exe) = install.exe() {
        remove_all_users_shortcuts(&exe, &mut report);
        remove_machine_autostart(&exe, &mut report);
    }

    let mut files_handled = true;
    if let Some(dir) = install.dir.as_deref() {
        if spares_this_install {
            // This copy's own files - only the registry entries and shortcuts were leftovers.
        } else if !dir.exists() {
            // Already gone (deleted by hand, or by an earlier run).
        } else if !is_plausible_install_dir(dir, &protected_dirs()) || is_redirected(dir) {
            report.warnings.push(format!(
                "{} doesn't look like an install folder (or is redirected), left its files alone",
                dir.display()
            ));
            report.left_behind.push(dir.display().to_string());
        } else {
            files_handled = remove_known_files(dir, &mut report);
        }
    }

    // Kept while a known file is stuck, so the cleanup is offered (and retried) again.
    if files_handled {
        remove_registry_keys(&mut report);
    }
    // Detection keys off this entry; while it's still there the cleanup will be offered again, so
    // it can't count as done.
    let entry_remains = !is_not_found(&detect::open_hklm(&uninstall_key()));

    report.outcome = Some(if !files_handled || entry_remains {
        CleanupOutcome::Failed
    } else if report.scheduled_for_reboot.is_empty() && report.left_behind.is_empty() {
        CleanupOutcome::Removed
    } else {
        CleanupOutcome::RemovedWithLeftovers
    });
    report
}

/// Folders an `InstallLocation` must never be, whatever HKLM says.
fn protected_dirs() -> Vec<PathBuf> {
    [
        FOLDERID_Windows,
        FOLDERID_System,
        FOLDERID_SystemX86,
        FOLDERID_ProgramFiles,
        FOLDERID_ProgramFilesX86,
        FOLDERID_ProgramData,
        FOLDERID_UserProfiles,
        FOLDERID_Public,
    ]
    .iter()
    .filter_map(known_folder)
    .collect()
}

fn is_reparse_point(path: &Path) -> bool {
    std::fs::symlink_metadata(path)
        .is_ok_and(|meta| meta.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0)
}

/// Whether any part of `dir` is a junction/symlink: resolving it then lands somewhere else. A
/// custom install folder can be user-writable, and swapping it (or `libs`) for a junction into a
/// system folder would otherwise point this elevated process's deletes - including the
/// delete-at-reboot fallback, which runs as SYSTEM - at that folder's files.
fn is_redirected(dir: &Path) -> bool {
    match std::fs::canonicalize(dir) {
        Ok(resolved) => !same_path(&resolved, dir),
        Err(_) => true,
    }
}

/// Deletes every known file under `dir`, then `libs` and `dir` itself if they're empty. Returns
/// whether every known file present was deleted or scheduled for deletion at reboot.
fn remove_known_files(dir: &Path, report: &mut CleanupReport) -> bool {
    let mut scheduled = HashSet::new();
    let mut all_handled = true;

    let libs = dir.join(LIBS_DIR);
    if is_reparse_point(&libs) {
        report.warnings.push(format!(
            "{} is a junction or symlink, left it alone",
            libs.display()
        ));
        report.left_behind.push(libs.display().to_string());
    } else {
        for name in LIBS {
            all_handled &= remove_known_file(&libs.join(name), report, &mut scheduled);
        }
        remove_dir_if_empty(&libs, report, &mut scheduled, None);
    }

    for name in ROOT {
        all_handled &= remove_known_file(&dir.join(name), report, &mut scheduled);
    }
    remove_dir_if_empty(dir, report, &mut scheduled, Some(&libs));

    all_handled
}

/// Deletes one known file, falling back to deletion at the next reboot when it's in use (another
/// Windows account's running copy) - possible only because this process is elevated. Returns
/// `false` only if the file is still there with no deletion scheduled.
fn remove_known_file(
    path: &Path,
    report: &mut CleanupReport,
    scheduled: &mut HashSet<String>,
) -> bool {
    let meta = match std::fs::symlink_metadata(path) {
        Ok(meta) => meta,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return true,
        Err(e) => {
            report.failed.push(format!("{}: {e}", path.display()));
            return false;
        }
    };
    // A folder or link wearing one of our file names isn't something we installed - it stays, and
    // remove_dir_if_empty reports it as left behind.
    if !meta.is_file() || meta.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0 {
        return true;
    }

    let mut result = std::fs::remove_file(path);
    if result.is_err() && meta.permissions().readonly() {
        let mut permissions = meta.permissions();
        // On Windows this only clears FILE_ATTRIBUTE_READONLY, which blocks deletion; the lint is
        // about Unix, where it would make the file world-writable.
        #[allow(clippy::permissions_set_readonly_false)]
        permissions.set_readonly(false);
        if std::fs::set_permissions(path, permissions).is_ok() {
            result = std::fs::remove_file(path);
        }
    }

    match result {
        Ok(()) => {
            report.deleted_file_count += 1;
            true
        }
        Err(delete_error) => match schedule_delete_at_reboot(path) {
            Ok(()) => {
                scheduled.insert(comparable(path));
                report.scheduled_for_reboot.push(path.display().to_string());
                true
            }
            Err(schedule_error) => {
                report.failed.push(format!(
                    "{}: {delete_error} (scheduling it for deletion at reboot failed too: {schedule_error})",
                    path.display()
                ));
                false
            }
        },
    }
}

fn schedule_delete_at_reboot(path: &Path) -> windows::core::Result<()> {
    unsafe {
        MoveFileExW(
            &HSTRING::from(path.as_os_str()),
            PCWSTR::null(),
            MOVEFILE_DELAY_UNTIL_REBOOT,
        )
    }
}

/// Removes `dir` if it's empty. If all that's left is already scheduled for deletion at reboot,
/// the folder is scheduled after it (Windows works through pending deletions in order). Anything
/// else in it wasn't installed by SGI: it's reported and the folder stays. `reported_subdir` is a
/// subfolder whose own contents were already reported, so it isn't listed a second time.
fn remove_dir_if_empty(
    dir: &Path,
    report: &mut CleanupReport,
    scheduled: &mut HashSet<String>,
    reported_subdir: Option<&Path>,
) {
    let entries: Vec<PathBuf> = match std::fs::read_dir(dir) {
        Ok(entries) => entries
            .filter_map(|entry| entry.ok().map(|e| e.path()))
            .collect(),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return,
        Err(e) => {
            report
                .warnings
                .push(format!("couldn't list {}: {e}", dir.display()));
            return;
        }
    };

    if entries.is_empty() {
        match std::fs::remove_dir(dir) {
            Ok(()) => report.removed_dirs.push(dir.display().to_string()),
            Err(e) => report
                .warnings
                .push(format!("couldn't remove {}: {e}", dir.display())),
        }
        return;
    }

    if entries
        .iter()
        .all(|entry| scheduled.contains(&comparable(entry)))
    {
        if schedule_delete_at_reboot(dir).is_ok() {
            scheduled.insert(comparable(dir));
            report.scheduled_for_reboot.push(dir.display().to_string());
        }
        return;
    }

    for entry in entries {
        let already_reported = reported_subdir.is_some_and(|sub| same_path(&entry, sub));
        if !already_reported && !scheduled.contains(&comparable(&entry)) {
            report.left_behind.push(entry.display().to_string());
        }
    }
}

/// The all-users Start Menu and Public Desktop shortcuts the per-machine installer created -
/// removed only when they launch the old exe.
fn remove_all_users_shortcuts(old_exe: &Path, report: &mut CleanupReport) {
    for (folder_id, is_desktop) in [
        (FOLDERID_CommonPrograms, false),
        (FOLDERID_PublicDesktop, true),
    ] {
        let Some(folder) = known_folder(&folder_id) else {
            continue;
        };
        let shortcut = folder.join(format!("{PRODUCT_NAME}.lnk"));
        if !shortcut.is_file() {
            continue;
        }
        match shell_link::target(&shortcut) {
            Some(target) if same_path(&target, old_exe) => match std::fs::remove_file(&shortcut) {
                Ok(()) => {
                    report
                        .removed_shortcuts
                        .push(shortcut.display().to_string());
                    report.removed_desktop_shortcut |= is_desktop;
                }
                Err(e) => report
                    .warnings
                    .push(format!("couldn't remove {}: {e}", shortcut.display())),
            },
            _ => report.warnings.push(format!(
                "{} doesn't point at the old install, kept it",
                shortcut.display()
            )),
        }
    }
}

/// tauri-plugin-autostart writes to HKLM instead of HKCU when SGI runs as administrator (its
/// "dynamic" mode tries HKLM first), so a machine-wide autostart entry for the old exe is possible.
/// It's removed with its Task Manager state; if it was enabled, the main process gives the user an
/// HKCU entry for the new copy (see `CleanupReport::removed_machine_autostart`).
fn remove_machine_autostart(old_exe: &Path, report: &mut CleanupReport) {
    let Ok(run) = LOCAL_MACHINE
        .options()
        .read()
        .write()
        .access(KEY_WOW64_64KEY.0)
        .open(RUN_KEY)
    else {
        return;
    };
    let Some(target) = run
        .get_string(PRODUCT_NAME)
        .ok()
        .and_then(|value| run_value_exe(&value))
    else {
        return;
    };
    if !same_path(&target, old_exe) {
        return;
    }

    // auto-launch's own reading of StartupApproved: no value, or one whose last 8 bytes (the
    // time it was disabled) are zero, means enabled.
    let approved = LOCAL_MACHINE
        .options()
        .read()
        .write()
        .access(KEY_WOW64_64KEY.0)
        .open(STARTUP_APPROVED_RUN_KEY);
    let enabled = match approved.as_ref().map(|key| key.get_value(PRODUCT_NAME)) {
        Ok(Ok(value)) => value.len() < 8 || value.iter().rev().take(8).all(|b| *b == 0),
        _ => true,
    };

    match run.remove_value(PRODUCT_NAME) {
        Ok(()) => {
            report
                .removed_registry_keys
                .push(format!(r"HKLM\{RUN_KEY}\{PRODUCT_NAME}"));
            report.removed_machine_autostart = enabled;
            if let Ok(approved) = approved {
                let _ = approved.remove_value(PRODUCT_NAME);
            }
        }
        Err(e) => report.warnings.push(format!(
            r"couldn't remove HKLM\{RUN_KEY}\{PRODUCT_NAME}: {e}"
        )),
    }
}

/// `MANUPRODUCTKEY`, then `MANUKEY` if nothing else lives there, then the uninstall entry - last,
/// because it's what detection keys off.
fn remove_registry_keys(report: &mut CleanupReport) {
    remove_hklm_tree(&product_key(), report);

    let manufacturer = manufacturer_key();
    let is_empty = detect::open_hklm(&manufacturer).is_ok_and(|key| {
        key.keys().is_ok_and(|mut keys| keys.next().is_none())
            && key.values().is_ok_and(|mut values| values.next().is_none())
    });
    if is_empty {
        remove_hklm_tree(&manufacturer, report);
    }

    remove_hklm_tree(&uninstall_key(), report);
}

fn remove_hklm_tree(path: &str, report: &mut CleanupReport) {
    if is_not_found(&detect::open_hklm(path)) {
        return;
    }
    // A 64-bit process's HKLM handle already addresses the 64-bit view the installer wrote to.
    match LOCAL_MACHINE.remove_tree(path) {
        Ok(()) => report.removed_registry_keys.push(format!(r"HKLM\{path}")),
        Err(e) => report
            .warnings
            .push(format!(r"couldn't remove HKLM\{path}: {e}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A fresh, empty folder under the temp dir, removed again on drop.
    struct TempDir(PathBuf);

    impl TempDir {
        fn new(name: &str) -> Self {
            let dir = std::env::temp_dir().join(format!(
                "sgi-legacy-install-test-{name}-{}",
                std::process::id()
            ));
            let _ = std::fs::remove_dir_all(&dir);
            std::fs::create_dir_all(&dir).unwrap();
            Self(dir)
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            // A junction is removed as a link, never followed.
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn touch(path: &Path) {
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(path, b"x").unwrap();
    }

    #[test]
    fn removes_a_clean_install_completely() {
        let temp = TempDir::new("clean");
        let install = temp.0.join("Steam Game Idler");
        for name in ["SteamUtility.exe", "SteamKit2.dll", "Newtonsoft.Json.dll"] {
            touch(&install.join(LIBS_DIR).join(name));
        }
        for name in ROOT {
            touch(&install.join(name));
        }

        let mut report = CleanupReport::default();
        assert!(remove_known_files(&install, &mut report));

        assert!(!install.exists());
        assert_eq!(report.deleted_file_count, 3 + ROOT.len());
        assert_eq!(report.removed_dirs.len(), 2);
        assert!(report.left_behind.is_empty() && report.scheduled_for_reboot.is_empty());
    }

    #[test]
    fn leaves_unknown_files_and_their_folders() {
        let temp = TempDir::new("unknown");
        let install = temp.0.join("Tools");
        touch(&install.join(LIBS_DIR).join("SteamUtility.exe"));
        touch(&install.join(LIBS_DIR).join("my-plugin.dll"));
        touch(&install.join(super::super::MAIN_EXE_NAME));
        touch(&install.join("notes.txt"));
        std::fs::create_dir_all(install.join("saves")).unwrap();

        let mut report = CleanupReport::default();
        assert!(remove_known_files(&install, &mut report));

        assert!(!install.join(LIBS_DIR).join("SteamUtility.exe").exists());
        assert!(!install.join(super::super::MAIN_EXE_NAME).exists());
        assert!(install.join(LIBS_DIR).join("my-plugin.dll").exists());
        assert!(install.join("notes.txt").exists());
        assert!(install.join("saves").exists());
        // libs' own leftover is listed once, not libs itself a second time.
        assert_eq!(report.left_behind.len(), 3, "{:?}", report.left_behind);
        assert!(report.removed_dirs.is_empty());
    }

    #[test]
    fn never_follows_a_junctioned_libs_folder() {
        let temp = TempDir::new("junction");
        let elsewhere = temp.0.join("elsewhere");
        touch(&elsewhere.join("System.dll"));
        let install = temp.0.join("Steam Game Idler");
        std::fs::create_dir_all(&install).unwrap();
        touch(&install.join("LICENSE"));
        let status = std::process::Command::new("cmd")
            .args(["/C", "mklink", "/J"])
            .arg(install.join(LIBS_DIR))
            .arg(&elsewhere)
            .output()
            .unwrap()
            .status;
        assert!(status.success(), "couldn't create the test junction");

        let mut report = CleanupReport::default();
        assert!(remove_known_files(&install, &mut report));

        assert!(elsewhere.join("System.dll").exists());
        assert!(!install.join("LICENSE").exists());
        assert!(install.join(LIBS_DIR).exists());
        assert!(report.warnings.iter().any(|w| w.contains("junction")));
    }

    #[test]
    fn treats_a_junctioned_install_folder_as_redirected() {
        let temp = TempDir::new("redirected");
        let real = temp.0.join("real");
        std::fs::create_dir_all(&real).unwrap();
        let link = temp.0.join("link");
        let status = std::process::Command::new("cmd")
            .args(["/C", "mklink", "/J"])
            .arg(&link)
            .arg(&real)
            .output()
            .unwrap()
            .status;
        assert!(status.success(), "couldn't create the test junction");

        assert!(is_redirected(&link));
        assert!(!is_redirected(&real));
    }
}
