//! Finds a per-machine install's leftovers through its HKLM uninstall entry - written by every
//! per-machine SGI installer, and the last thing the elevated cleanup deletes, so a cleanup that
//! was interrupted or only partly worked is still detected (and offered again) next launch.

use std::path::{Path, PathBuf};

use windows::Win32::System::Registry::KEY_WOW64_64KEY;
use windows_registry::{Key, LOCAL_MACHINE};

use super::paths::{same_path, strip_quotes};
use super::{MAIN_EXE_NAME, MANUFACTURER, PRODUCT_NAME};

/// `HRESULT_FROM_WIN32(ERROR_FILE_NOT_FOUND)` - the registry's "no such key/value".
const HRESULT_NOT_FOUND: u32 = 0x8007_0002;

pub(super) fn uninstall_key() -> String {
    format!(r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{PRODUCT_NAME}")
}

/// The NSIS template's `MANUKEY`.
pub(super) fn manufacturer_key() -> String {
    format!(r"SOFTWARE\{MANUFACTURER}")
}

/// The NSIS template's `MANUPRODUCTKEY` - its default value is the install folder.
pub(super) fn product_key() -> String {
    format!(r"SOFTWARE\{MANUFACTURER}\{PRODUCT_NAME}")
}

pub(super) fn is_not_found(error: &windows_registry::Result<Key>) -> bool {
    matches!(error, Err(e) if e.code().0 as u32 == HRESULT_NOT_FOUND)
}

/// Opens an HKLM key in the 64-bit registry view, which is where the x64 installer wrote (its
/// `SetRegView 64`). This exe is 64-bit, so that's the default view anyway - requested explicitly
/// so the intent doesn't depend on that.
pub(super) fn open_hklm(path: &str) -> windows_registry::Result<Key> {
    LOCAL_MACHINE
        .options()
        .read()
        .access(KEY_WOW64_64KEY.0)
        .open(path)
}

#[derive(Debug, Clone)]
pub(super) struct LegacyInstall {
    /// The uninstall entry's `InstallLocation` (falling back to `MANUPRODUCTKEY`'s default value),
    /// quotes stripped. `None` if neither holds a path - the registry leftovers can still go.
    pub dir: Option<PathBuf>,
    /// The old install folder is this install's own folder - someone ran an old per-machine
    /// installer and pointed it at `%LOCALAPPDATA%\Steam Game Idler`. Its files are this copy's
    /// files then, so only the registry entries and all-users shortcuts may be removed.
    pub same_folder: bool,
}

impl LegacyInstall {
    pub fn exe(&self) -> Option<PathBuf> {
        self.dir.as_ref().map(|dir| dir.join(MAIN_EXE_NAME))
    }
}

/// `current_exe_dir` is this running copy's folder, for [`LegacyInstall::same_folder`].
pub(super) fn detect(current_exe_dir: Option<&Path>) -> Option<LegacyInstall> {
    let key = open_hklm(&uninstall_key());
    if is_not_found(&key) {
        return None;
    }
    let key = match key {
        Ok(key) => key,
        Err(e) => {
            tracing::warn!(error = %e, "legacy_install: couldn't read the per-machine uninstall entry");
            return None;
        }
    };

    // The entry name alone could belong to some other "Steam Game Idler"; the NSIS template writes
    // both of these, so a real SGI entry always matches.
    let display_name = key.get_string("DisplayName").unwrap_or_default();
    let publisher = key.get_string("Publisher").unwrap_or_default();
    if display_name != PRODUCT_NAME || publisher != MANUFACTURER {
        tracing::info!(
            display_name,
            publisher,
            "legacy_install: per-machine uninstall entry isn't SGI's, ignoring it"
        );
        return None;
    }

    let dir = key
        .get_string("InstallLocation")
        .ok()
        .or_else(|| {
            open_hklm(&product_key())
                .and_then(|k| k.get_string(""))
                .ok()
        })
        .map(|value| strip_quotes(&value).to_string())
        .filter(|value| !value.is_empty())
        .map(PathBuf::from);

    let same_folder =
        matches!((&dir, current_exe_dir), (Some(dir), Some(current)) if same_path(dir, current));

    Some(LegacyInstall { dir, same_folder })
}
