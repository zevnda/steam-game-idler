//! Small `IShellLinkW` wrappers - read a shortcut's target, create one, re-point one - mirroring
//! what Tauri's NSIS template does in `utils.nsh` (`IsShortcutTarget`, `CreateShortcut` +
//! `SetLnkAppUserModelId`, `SetShortcutTarget`), plus known-folder lookup.

use std::ffi::OsString;
use std::os::windows::ffi::OsStringExt;
use std::path::{Path, PathBuf};

use windows::core::{Interface, GUID, HSTRING};
use windows::Win32::Storage::EnhancedStorage::PKEY_AppUserModel_ID;
use windows::Win32::System::Com::StructuredStorage::PROPVARIANT;
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CoTaskMemFree, CoUninitialize, IPersistFile,
    CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED, STGM_READ, STGM_READWRITE,
};
use windows::Win32::UI::Shell::PropertiesSystem::IPropertyStore;
use windows::Win32::UI::Shell::{IShellLinkW, SHGetKnownFolderPath, ShellLink, KF_FLAG_DEFAULT};

use super::paths::same_path;

/// Generous for a path - `MAX_PATH` is what the NSIS template uses, but a long-path-aware shortcut
/// can hold more.
const PATH_BUF_LEN: usize = 1024;

/// COM initialized on the current thread for as long as this value lives. Every function below
/// needs it; callers hold one across a batch of shortcut operations.
pub(super) struct ComApartment {
    initialized: bool,
}

impl ComApartment {
    pub fn init() -> Self {
        // S_OK and S_FALSE (already initialized on this thread) both need a matching
        // CoUninitialize. RPC_E_CHANGED_MODE (already a multithreaded apartment) doesn't, and
        // ShellLink works there too, so carry on either way.
        let hr = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };
        Self {
            initialized: hr.is_ok(),
        }
    }
}

impl Drop for ComApartment {
    fn drop(&mut self) {
        if self.initialized {
            unsafe { CoUninitialize() };
        }
    }
}

/// A known folder's path (`FOLDERID_*`), or `None` if Windows can't resolve it.
pub(super) fn known_folder(id: &GUID) -> Option<PathBuf> {
    unsafe {
        let raw = SHGetKnownFolderPath(id, KF_FLAG_DEFAULT, None).ok()?;
        let path = from_wide(raw.as_wide());
        CoTaskMemFree(Some(raw.0 as *const _));
        path
    }
}

fn new_link() -> windows::core::Result<IShellLinkW> {
    unsafe { CoCreateInstance(&ShellLink, None, CLSCTX_INPROC_SERVER) }
}

fn from_wide(buf: &[u16]) -> Option<PathBuf> {
    let len = buf.iter().position(|&c| c == 0).unwrap_or(buf.len());
    (len > 0).then(|| PathBuf::from(OsString::from_wide(&buf[..len])))
}

/// The shortcut's target path, with environment variables expanded, or `None` if the file isn't a
/// readable shortcut or doesn't point at a file. The target doesn't have to exist.
pub(super) fn target(path: &Path) -> Option<PathBuf> {
    let link = new_link().ok()?;
    let file: IPersistFile = link.cast().ok()?;
    let mut buf = [0u16; PATH_BUF_LEN];
    unsafe {
        file.Load(&HSTRING::from(path.as_os_str()), STGM_READ)
            .ok()?;
        // No SLGP_* flag: the expanded long path. (The NSIS template compares the raw path, but a
        // shortcut Windows itself created - a taskbar pin - may store `%ProgramFiles%`-style raw
        // paths, which only compare equal once expanded.)
        link.GetPath(&mut buf, std::ptr::null_mut(), 0).ok()?;
    }
    from_wide(&buf)
}

/// Writes a new shortcut at `path` launching `target` (overwriting any file there), with the
/// working directory set to the target's folder like NSIS's `CreateShortcut`, and `app_id` as its
/// AppUserModelID like the template's `SetLnkAppUserModelId`.
pub(super) fn create(path: &Path, target: &Path, app_id: &str) -> windows::core::Result<()> {
    let link = new_link()?;
    unsafe {
        link.SetPath(&HSTRING::from(target.as_os_str()))?;
        if let Some(dir) = target.parent() {
            link.SetWorkingDirectory(&HSTRING::from(dir.as_os_str()))?;
        }
    }
    set_app_id(&link, app_id)?;
    let file: IPersistFile = link.cast()?;
    unsafe { file.Save(&HSTRING::from(path.as_os_str()), true) }
}

fn set_app_id(link: &IShellLinkW, app_id: &str) -> windows::core::Result<()> {
    let store: IPropertyStore = link.cast()?;
    // A VT_BSTR the PROPVARIANT owns - the same type the template's SetLnkAppUserModelId writes.
    // It must own its string: the windows crate's Drop for PROPVARIANT calls PropVariantClear,
    // which would free a borrowed buffer with the COM allocator and corrupt the heap.
    let value = PROPVARIANT::from(app_id);
    unsafe {
        store.SetValue(&PKEY_AppUserModel_ID, &value)?;
        store.Commit()
    }
}

/// Re-points the shortcut at `path` from `old_target` to `new_target`, keeping everything else
/// (AppUserModelID, arguments, hotkey). The working directory and icon follow along when they
/// pointed at the old exe's folder/file, since that folder is about to be deleted - a shortcut
/// whose working directory doesn't exist fails to launch at all.
pub(super) fn retarget(
    path: &Path,
    old_target: &Path,
    new_target: &Path,
) -> windows::core::Result<()> {
    let link = new_link()?;
    let file: IPersistFile = link.cast()?;
    let path = HSTRING::from(path.as_os_str());
    unsafe {
        file.Load(&path, STGM_READWRITE)?;
        link.SetPath(&HSTRING::from(new_target.as_os_str()))?;

        let mut buf = [0u16; PATH_BUF_LEN];
        if link.GetWorkingDirectory(&mut buf).is_ok() {
            if let (Some(dir), Some(old_dir), Some(new_dir)) =
                (from_wide(&buf), old_target.parent(), new_target.parent())
            {
                if same_path(&dir, old_dir) {
                    link.SetWorkingDirectory(&HSTRING::from(new_dir.as_os_str()))?;
                }
            }
        }

        let mut buf = [0u16; PATH_BUF_LEN];
        let mut index = 0;
        if link.GetIconLocation(&mut buf, &mut index).is_ok() {
            if let Some(icon) = from_wide(&buf) {
                if same_path(&icon, old_target) {
                    link.SetIconLocation(&HSTRING::from(new_target.as_os_str()), index)?;
                }
            }
        }

        file.Save(&path, true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn app_id(path: &Path) -> String {
        let link = new_link().unwrap();
        let file: IPersistFile = link.cast().unwrap();
        unsafe {
            file.Load(&HSTRING::from(path.as_os_str()), STGM_READ)
                .unwrap()
        };
        let store: IPropertyStore = link.cast().unwrap();
        unsafe { store.GetValue(&PKEY_AppUserModel_ID).unwrap() }.to_string()
    }

    #[test]
    fn creates_reads_and_retargets_a_shortcut() {
        let _com = ComApartment::init();
        let dir = std::env::temp_dir().join(format!("sgi-shell-link-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(&dir).unwrap();
        let old_exe = dir.join(r"old\Steam Game Idler.exe");
        let new_exe = dir.join(r"new\Steam Game Idler.exe");
        let shortcut = dir.join("Steam Game Idler.lnk");

        create(&shortcut, &old_exe, "com.zevnda.steam-game-idler").unwrap();
        assert!(target(&shortcut).is_some_and(|t| same_path(&t, &old_exe)));
        assert_eq!(app_id(&shortcut), "com.zevnda.steam-game-idler");

        retarget(&shortcut, &old_exe, &new_exe).unwrap();
        assert!(target(&shortcut).is_some_and(|t| same_path(&t, &new_exe)));
        assert_eq!(app_id(&shortcut), "com.zevnda.steam-game-idler");

        assert_eq!(target(&dir.join("missing.lnk")), None);
        let _ = std::fs::remove_dir_all(&dir);
    }
}
