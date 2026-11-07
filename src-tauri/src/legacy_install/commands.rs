//! The Tauri commands behind `LegacyInstallPrompt.tsx`, plus [`on_startup`] (called from `lib.rs`'s
//! `setup()`). Only an installed Windows build can have a per-machine install to clean up; anywhere
//! else (Linux, the portable zip, dev builds) the status is always "not detected", so the frontend
//! never offers the cleanup and the other commands are never reached.

use serde::Serialize;
use tauri::AppHandle;

use crate::error::{AppError, AppResult};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LegacyInstallStatus {
    /// A per-machine install's leftovers are registered on this PC.
    pub detected: bool,
    /// The user ticked "Don't show this again" (`Settings::legacy_install_prompt_dismissed`).
    pub prompt_dismissed: bool,
}

/// What the frontend tells the user. Leftover details (files deleted at the next reboot, files SGI
/// didn't install) only go to the log - the old copy is gone either way.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
// Off Windows only `NotFound` is ever returned.
#[cfg_attr(not(windows), allow(dead_code))]
pub enum LegacyCleanupResult {
    Removed,
    /// The UAC prompt was declined, or the user couldn't provide admin credentials.
    Declined,
    NotFound,
    Failed,
}

#[tauri::command]
pub fn get_legacy_install_status(app_handle: AppHandle) -> LegacyInstallStatus {
    #[cfg(windows)]
    {
        imp::status(&app_handle)
    }

    #[cfg(not(windows))]
    {
        let _ = app_handle;
        LegacyInstallStatus {
            detected: false,
            prompt_dismissed: false,
        }
    }
}

/// Asks Windows for admin rights (a UAC prompt) and runs the elevated cleanup. Never kills a
/// process or interrupts automation - see the module docs in `legacy_install/mod.rs`.
#[tauri::command]
pub async fn remove_legacy_install(app_handle: AppHandle) -> LegacyCleanupResult {
    #[cfg(windows)]
    {
        imp::remove(app_handle).await
    }

    #[cfg(not(windows))]
    {
        let _ = app_handle;
        LegacyCleanupResult::NotFound
    }
}

/// "Don't show this again": stops the prompt for good on this PC (stored in `settings.json`, so
/// the Debug tab's "Clear Data" brings it back).
#[tauri::command]
pub fn dismiss_legacy_install_prompt(app_handle: AppHandle) -> AppResult<()> {
    crate::settings::set_legacy_install_prompt_dismissed(&app_handle, true)
        .map_err(AppError::SettingsIo)?;
    tracing::info!("legacy_install: user chose not to be asked about the old install again");

    #[cfg(windows)]
    imp::on_dismissed();

    Ok(())
}

/// Re-points the user's autostart value and pins, and handles a cleanup report a previous session
/// never got to (the app closed, or a tray update installed, while the elevated process was still
/// running). Runs on a blocking thread so startup isn't held up by registry/COM calls.
pub fn on_startup(app_handle: &AppHandle) {
    #[cfg(windows)]
    imp::on_startup(app_handle);

    #[cfg(not(windows))]
    let _ = app_handle;
}

#[cfg(windows)]
mod imp {
    use std::path::{Path, PathBuf};
    use std::sync::{Mutex, PoisonError};
    use std::time::Duration;

    use tauri::{AppHandle, Manager};
    use windows::core::{HSTRING, PCWSTR};
    use windows::Win32::Foundation::{CloseHandle, ERROR_CANCELLED, HWND, WAIT_OBJECT_0};
    use windows::Win32::System::Threading::{GetExitCodeProcess, WaitForSingleObject};
    use windows::Win32::UI::Shell::{
        ShellExecuteExW, SEE_MASK_NOASYNC, SEE_MASK_NOCLOSEPROCESS, SHELLEXECUTEINFOW,
    };
    use windows::Win32::UI::WindowsAndMessaging::SW_HIDE;

    use super::{LegacyCleanupResult, LegacyInstallStatus};
    use crate::legacy_install::detect::{detect, LegacyInstall};
    use crate::legacy_install::elevated::{exit_code, FLAG, RESULT_FILE_ARG};
    use crate::legacy_install::paths::{without_verbatim_prefix, RESULT_FILE_NAME};
    use crate::legacy_install::report::{CleanupOutcome, CleanupReport};
    use crate::legacy_install::shell_link::ComApartment;
    use crate::legacy_install::user_fixups;
    use crate::platform;

    /// Bounds only the elevated process's own run (normally well under a second) - the UAC prompt
    /// is answered inside `ShellExecuteExW`, before this wait starts.
    const ELEVATED_TIMEOUT: Duration = Duration::from_secs(120);

    /// Serializes report handling between the startup pass and a cleanup the user starts.
    static REPORT_LOCK: Mutex<()> = Mutex::new(());

    /// Installed release builds only - the same gate as auto-update (`platform::can_auto_update`):
    /// a portable copy or a dev build must never offer to delete an install.
    fn enabled() -> bool {
        platform::can_auto_update()
    }

    /// The plain path this exe was launched from - what gets written into the autostart value and
    /// shortcuts. `std::env::current_exe`, not `tauri::utils::platform::current_exe`: Tauri's
    /// canonicalizes to a verbatim `\\?\C:\...` path, which `IShellLink::SetPath` rejects and
    /// which wouldn't match what tauri-plugin-autostart (std's version) or NSIS write.
    fn current_exe() -> Option<PathBuf> {
        std::env::current_exe()
            .map(without_verbatim_prefix)
            .inspect_err(|e| tracing::warn!(error = %e, "legacy_install: couldn't resolve own exe"))
            .ok()
    }

    fn result_path(app: &AppHandle) -> Option<PathBuf> {
        platform::cache_dir(app)
            .inspect_err(
                |e| tracing::warn!(error = %e, "legacy_install: couldn't resolve cache dir"),
            )
            .ok()
            .map(|dir| dir.join(RESULT_FILE_NAME))
    }

    pub fn status(app: &AppHandle) -> LegacyInstallStatus {
        let detected = enabled() && current_exe().is_some_and(|exe| detect(exe.parent()).is_some());
        let prompt_dismissed = crate::settings::load(app)
            .map(|settings| settings.legacy_install_prompt_dismissed)
            .unwrap_or(false);
        LegacyInstallStatus {
            detected,
            prompt_dismissed,
        }
    }

    pub fn on_startup(app: &AppHandle) {
        if !enabled() {
            return;
        }
        let app = app.clone();
        tauri::async_runtime::spawn_blocking(move || {
            let Some(exe) = current_exe() else {
                return;
            };
            let legacy = detect(exe.parent());
            if let Some(legacy) = &legacy {
                tracing::info!(
                    install_dir = ?legacy.dir,
                    same_folder = legacy.same_folder,
                    "legacy_install: found a per-machine install's leftovers"
                );
            }

            let _com = ComApartment::init();
            let legacy_exe = legacy.as_ref().and_then(LegacyInstall::exe);
            user_fixups::repoint_autostart(&exe, legacy_exe.as_deref());
            user_fixups::retarget_pins(&exe, legacy_exe.as_deref());

            if let Some(path) = result_path(&app).filter(|path| path.exists()) {
                let _guard = REPORT_LOCK.lock().unwrap_or_else(PoisonError::into_inner);
                tracing::info!(
                    "legacy_install: processing a cleanup report from a previous session"
                );
                finish(&exe, &path, None);
            }
        });
    }

    pub async fn remove(app: AppHandle) -> LegacyCleanupResult {
        if !enabled() {
            return LegacyCleanupResult::NotFound;
        }
        // Raw value, since HWND isn't Send. Owning the UAC prompt by the main window is what makes
        // Windows show it as a foreground dialog rather than a flashing taskbar button.
        let owner = app
            .get_webview_window("main")
            .and_then(|window| window.hwnd().ok())
            .map_or(0, |hwnd| hwnd.0 as isize);
        tauri::async_runtime::spawn_blocking(move || remove_blocking(&app, owner))
            .await
            .unwrap_or_else(|e| {
                tracing::warn!(error = %e, "legacy_install: cleanup task failed");
                LegacyCleanupResult::Failed
            })
    }

    fn remove_blocking(app: &AppHandle, owner: isize) -> LegacyCleanupResult {
        let Some(exe) = current_exe() else {
            return LegacyCleanupResult::Failed;
        };
        if detect(exe.parent()).is_none() {
            return LegacyCleanupResult::NotFound;
        }
        let Some(path) = result_path(app) else {
            return LegacyCleanupResult::Failed;
        };

        let _guard = REPORT_LOCK.lock().unwrap_or_else(PoisonError::into_inner);
        if let Some(dir) = path.parent() {
            if let Err(e) = std::fs::create_dir_all(dir) {
                tracing::warn!(error = %e, "legacy_install: couldn't create the cache dir");
                return LegacyCleanupResult::Failed;
            }
        }
        // A stale report would otherwise be read as this run's.
        let _ = std::fs::remove_file(&path);

        tracing::info!(
            "legacy_install: asking Windows for permission to remove the per-machine install"
        );
        match launch_elevated(&exe, &path, owner) {
            Ok(code) => finish(&exe, &path, Some(code)),
            Err(LaunchError::Declined) => {
                tracing::info!("legacy_install: the UAC prompt was declined, nothing was removed");
                LegacyCleanupResult::Declined
            }
            Err(LaunchError::TimedOut) => {
                tracing::warn!(
                    "legacy_install: the elevated cleanup is still running; its report will be read next launch"
                );
                LegacyCleanupResult::Failed
            }
            Err(LaunchError::Failed(error)) => {
                tracing::warn!(error = %error, "legacy_install: couldn't start the elevated cleanup");
                LegacyCleanupResult::Failed
            }
        }
    }

    pub fn on_dismissed() {
        if !enabled() {
            return;
        }
        let Some(exe) = current_exe() else {
            return;
        };
        let _com = ComApartment::init();
        // The old shortcuts stay (removing them needs the elevation the user just turned down), so
        // this copy gets a Start Menu entry of its own: a way in that doesn't go through the old
        // exe, and what Windows needs to keep showing notifications should the old copy ever go.
        // No Desktop one - it would sit next to the old one under the same name.
        user_fixups::create_user_shortcuts(&exe, false);
    }

    enum LaunchError {
        Declined,
        TimedOut,
        Failed(String),
    }

    /// Relaunches this exe through Windows' "run as administrator" request and waits for it.
    fn launch_elevated(exe: &Path, result_path: &Path, owner: isize) -> Result<u32, LaunchError> {
        let verb = HSTRING::from("runas");
        let file = HSTRING::from(exe.as_os_str());
        let parameters = HSTRING::from(format!(
            "{FLAG} {RESULT_FILE_ARG} \"{}\"",
            result_path.display()
        ));
        let mut info = SHELLEXECUTEINFOW {
            cbSize: std::mem::size_of::<SHELLEXECUTEINFOW>() as u32,
            // NOASYNC: this blocking-pool thread has no message loop for an async launch to finish
            // on. NOCLOSEPROCESS: hand back the process handle to wait on.
            fMask: SEE_MASK_NOCLOSEPROCESS | SEE_MASK_NOASYNC,
            hwnd: HWND(owner as *mut _),
            lpVerb: PCWSTR(verb.as_ptr()),
            lpFile: PCWSTR(file.as_ptr()),
            lpParameters: PCWSTR(parameters.as_ptr()),
            nShow: SW_HIDE.0,
            ..Default::default()
        };

        unsafe {
            if let Err(e) = ShellExecuteExW(&mut info) {
                return Err(if e.code() == ERROR_CANCELLED.to_hresult() {
                    LaunchError::Declined
                } else {
                    LaunchError::Failed(e.to_string())
                });
            }
            if info.hProcess.is_invalid() {
                return Err(LaunchError::Failed("no process handle returned".into()));
            }
            let waited = WaitForSingleObject(info.hProcess, ELEVATED_TIMEOUT.as_millis() as u32);
            let result = if waited == WAIT_OBJECT_0 {
                let mut code = 0;
                GetExitCodeProcess(info.hProcess, &mut code)
                    .map(|()| code)
                    .map_err(|e| LaunchError::Failed(e.to_string()))
            } else {
                Err(LaunchError::TimedOut)
            };
            let _ = CloseHandle(info.hProcess);
            result
        }
    }

    fn outcome_from_exit_code(code: u32) -> CleanupOutcome {
        match code {
            exit_code::REMOVED => CleanupOutcome::Removed,
            exit_code::REMOVED_WITH_LEFTOVERS => CleanupOutcome::RemovedWithLeftovers,
            exit_code::NOT_FOUND => CleanupOutcome::NotFound,
            _ => CleanupOutcome::Failed,
        }
    }

    /// Logs the elevated run's report, replaces what it removed with per-user equivalents, and
    /// deletes the report. `exit_code` is the fallback when the report is missing or unreadable.
    fn finish(exe: &Path, path: &Path, exit_code: Option<u32>) -> LegacyCleanupResult {
        let report = match CleanupReport::read(path) {
            Ok(report) => Some(report),
            Err(e) => {
                tracing::warn!(error = %e, ?exit_code, "legacy_install: couldn't read the cleanup report");
                None
            }
        };
        let _ = std::fs::remove_file(path);

        let outcome = report
            .as_ref()
            .and_then(|report| report.outcome)
            .or(exit_code.map(outcome_from_exit_code))
            .unwrap_or(CleanupOutcome::Failed);
        if let Some(report) = &report {
            log_report(report);
        }

        match outcome {
            CleanupOutcome::Removed | CleanupOutcome::RemovedWithLeftovers => {
                let _com = ComApartment::init();
                let desktop = report.as_ref().is_some_and(|r| r.removed_desktop_shortcut);
                user_fixups::create_user_shortcuts(exe, desktop);
                if report.as_ref().is_some_and(|r| r.removed_machine_autostart) {
                    user_fixups::ensure_autostart(exe);
                }
                LegacyCleanupResult::Removed
            }
            CleanupOutcome::NotFound => LegacyCleanupResult::NotFound,
            CleanupOutcome::Failed => LegacyCleanupResult::Failed,
        }
    }

    fn log_report(report: &CleanupReport) {
        tracing::info!(
            outcome = ?report.outcome,
            install_dir = ?report.install_dir,
            same_folder = report.same_folder,
            deleted_files = report.deleted_file_count,
            "legacy_install: elevated cleanup finished"
        );
        for path in &report.removed_dirs {
            tracing::info!(path = %path, "legacy_install: removed folder");
        }
        for path in &report.removed_shortcuts {
            tracing::info!(path = %path, "legacy_install: removed all-users shortcut");
        }
        for key in &report.removed_registry_keys {
            tracing::info!(key = %key, "legacy_install: removed registry entry");
        }
        for path in &report.scheduled_for_reboot {
            tracing::info!(path = %path, "legacy_install: in use, will be deleted at the next reboot");
        }
        for path in &report.left_behind {
            tracing::info!(path = %path, "legacy_install: not installed by SGI, left in place");
        }
        for failure in &report.failed {
            tracing::warn!(failure = %failure, "legacy_install: couldn't remove a file");
        }
        for warning in &report.warnings {
            tracing::warn!(warning = %warning, "legacy_install: cleanup warning");
        }
    }
}
