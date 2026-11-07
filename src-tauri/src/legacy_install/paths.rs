//! Pure string/path helpers shared by detection, the elevated cleanup and the startup fixups. Kept
//! free of Win32 calls so CI (which builds on Linux) still runs their tests.
#![cfg_attr(not(windows), allow(dead_code))]

use std::path::{Path, PathBuf};

use super::MAIN_EXE_NAME;

/// The elevated process writes its report here (in the user's cache directory, passed on the
/// command line). The elevated side accepts no other file name, so the path argument can't be
/// used to make an elevated process write anywhere else under a name of the caller's choosing.
pub(super) const RESULT_FILE_NAME: &str = "legacy-install-cleanup.json";

/// NSIS writes the uninstall entry's `InstallLocation` wrapped in quotes (the template's
/// `"$\"$INSTDIR$\""`), while `HKLM\Software\zevnda\Steam Game Idler`'s default value is bare.
/// Accepts either.
pub(super) fn strip_quotes(value: &str) -> &str {
    let trimmed = value.trim();
    trimmed
        .strip_prefix('"')
        .and_then(|inner| inner.strip_suffix('"'))
        .unwrap_or(trimmed)
}

/// A Windows path in a form two spellings of the same path compare equal in: `\\?\` dropped
/// (`std::fs::canonicalize` adds it), `/` turned into `\`, trailing separators removed, and
/// lowercased, since NTFS paths are case-insensitive.
pub(super) fn comparable(path: &Path) -> String {
    let raw = path.to_string_lossy();
    let raw = raw.strip_prefix(r"\\?\").unwrap_or(&raw);
    raw.replace('/', "\\").trim_end_matches('\\').to_lowercase()
}

/// Drops a verbatim `\\?\` prefix (`\\?\UNC\server\share` back to `\\server\share`). A path that
/// gets written somewhere other programs read must be the plain form: `IShellLink::SetPath`
/// rejects verbatim paths outright (E_INVALIDARG), NSIS's uninstaller compares shortcut targets as
/// plain strings, and tauri-plugin-autostart writes plain paths into the Run value.
pub(super) fn without_verbatim_prefix(path: PathBuf) -> PathBuf {
    let raw = path.to_string_lossy();
    if let Some(unc) = raw.strip_prefix(r"\\?\UNC\") {
        PathBuf::from(format!(r"\\{unc}"))
    } else if let Some(plain) = raw.strip_prefix(r"\\?\") {
        PathBuf::from(plain)
    } else {
        path
    }
}

pub(super) fn same_path(a: &Path, b: &Path) -> bool {
    comparable(a) == comparable(b)
}

/// Whether two folders are the same one or either holds the other.
pub(super) fn dirs_overlap(a: &Path, b: &Path) -> bool {
    let (a, b) = (comparable(a), comparable(b));
    let contains = |outer: &str, inner: &str| {
        inner
            .strip_prefix(outer)
            .is_some_and(|rest| rest.is_empty() || rest.starts_with('\\'))
    };
    contains(&a, &b) || contains(&b, &a)
}

/// The exe path in a `...\CurrentVersion\Run` value. tauri-plugin-autostart (via auto-launch)
/// writes `<path> <args>` with the path unquoted - and SGI registers no args, so in practice it's
/// the path plus a trailing space. A quoted path is accepted too. An unquoted value can't be split
/// on spaces (the path has them), so the path ends at the first `.exe` followed by whitespace or
/// the end of the value - not at any `.exe`, which could be part of a folder name.
pub(super) fn run_value_exe(value: &str) -> Option<PathBuf> {
    let value = value.trim();
    if let Some(rest) = value.strip_prefix('"') {
        let (path, _) = rest.split_once('"')?;
        return (!path.is_empty()).then(|| PathBuf::from(path));
    }

    let bytes = value.as_bytes();
    // `.exe` is ASCII, so a byte match always lands on a char boundary.
    (0..bytes.len().saturating_sub(3))
        .find(|&i| {
            bytes[i..i + 4].eq_ignore_ascii_case(b".exe")
                && bytes.get(i + 4).is_none_or(|b| b.is_ascii_whitespace())
        })
        .map(|i| PathBuf::from(&value[..i + 4]))
}

/// What tauri-plugin-autostart writes for `exe` with no args, byte for byte (auto-launch's
/// `format!("{} {}", app_path, args.join(" "))`), so the Settings toggle's later `isEnabled()`/
/// `disable()` treats a re-pointed value exactly like one it wrote itself.
pub(super) fn autostart_run_value(exe: &Path) -> String {
    format!("{} ", exe.display())
}

/// Whether a user-owned pointer at `target` (the autostart value, a taskbar pin) should move to
/// `current_exe`: it names the old per-machine exe, or an SGI exe that no longer exists (deleted by
/// an earlier cleanup, or a portable copy that's gone). Anything else - say, a portable copy the
/// user still runs - is left alone.
pub(super) fn should_repoint(
    target: &Path,
    current_exe: &Path,
    legacy_exe: Option<&Path>,
    target_exists: bool,
) -> bool {
    if same_path(target, current_exe) {
        return false;
    }
    if legacy_exe.is_some_and(|legacy| same_path(target, legacy)) {
        return true;
    }
    !target_exists
        && target
            .file_name()
            .is_some_and(|name| name.to_string_lossy().eq_ignore_ascii_case(MAIN_EXE_NAME))
}

/// Sanity check before the elevated process deletes anything under `dir`: an absolute path that
/// isn't a drive root or one of `protected` (the Windows folder, Program Files itself, ...). Only
/// known SGI file names are ever deleted, so this is a second line of defence against a corrupt or
/// tampered `InstallLocation`, not the only one.
pub(super) fn is_plausible_install_dir(dir: &Path, protected: &[PathBuf]) -> bool {
    dir.is_absolute() && dir.parent().is_some() && !protected.iter().any(|p| same_path(dir, p))
}

/// The elevated process's `--result-file` argument: absolute, and named [`RESULT_FILE_NAME`].
pub(super) fn is_valid_result_path(path: &Path) -> bool {
    path.is_absolute()
        && path
            .file_name()
            .is_some_and(|name| name == RESULT_FILE_NAME)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_install_location_quotes() {
        assert_eq!(
            strip_quotes(r#""C:\Program Files\Steam Game Idler""#),
            r"C:\Program Files\Steam Game Idler"
        );
        assert_eq!(
            strip_quotes(r"C:\Program Files\Steam Game Idler"),
            r"C:\Program Files\Steam Game Idler"
        );
        assert_eq!(strip_quotes(r#"  "D:\SGI"  "#), r"D:\SGI");
        // An unbalanced quote isn't a quoted path - left as it is.
        assert_eq!(strip_quotes(r#""D:\SGI"#), r#""D:\SGI"#);
    }

    #[test]
    fn compares_paths_case_and_separator_insensitively() {
        let a = Path::new(r"C:\Program Files\Steam Game Idler\");
        assert!(same_path(
            a,
            Path::new(r"c:\program files\steam game idler")
        ));
        assert!(same_path(
            a,
            Path::new(r"\\?\C:\Program Files\Steam Game Idler")
        ));
        assert!(same_path(a, Path::new("C:/Program Files/Steam Game Idler")));
        assert!(!same_path(
            a,
            Path::new(r"C:\Program Files\Steam Game Idler2")
        ));
    }

    #[test]
    fn drops_verbatim_prefixes() {
        assert_eq!(
            without_verbatim_prefix(PathBuf::from(r"\\?\C:\Users\me\SGI\Steam Game Idler.exe")),
            PathBuf::from(r"C:\Users\me\SGI\Steam Game Idler.exe")
        );
        assert_eq!(
            without_verbatim_prefix(PathBuf::from(r"\\?\UNC\server\share\SGI.exe")),
            PathBuf::from(r"\\server\share\SGI.exe")
        );
        assert_eq!(
            without_verbatim_prefix(PathBuf::from(r"C:\plain\SGI.exe")),
            PathBuf::from(r"C:\plain\SGI.exe")
        );
    }

    #[test]
    fn detects_overlapping_dirs() {
        let install = Path::new(r"C:\Users\me\AppData\Local\Steam Game Idler");
        assert!(dirs_overlap(
            install,
            Path::new(r"c:\users\me\appdata\local\steam game idler\")
        ));
        assert!(dirs_overlap(
            install,
            Path::new(r"C:\Users\me\AppData\Local")
        ));
        assert!(dirs_overlap(
            Path::new(r"C:\Users\me\AppData\Local"),
            install
        ));
        assert!(!dirs_overlap(
            install,
            Path::new(r"C:\Program Files\Steam Game Idler")
        ));
        // A shared name prefix isn't containment.
        assert!(!dirs_overlap(
            install,
            Path::new(r"C:\Users\me\AppData\Local\Steam Game Idler2")
        ));
    }

    #[test]
    fn reads_autostart_exe_from_run_value() {
        let exe = PathBuf::from(r"C:\Program Files\Steam Game Idler\Steam Game Idler.exe");
        // What auto-launch writes with no args: unquoted, trailing space.
        assert_eq!(
            run_value_exe(r"C:\Program Files\Steam Game Idler\Steam Game Idler.exe "),
            Some(exe.clone())
        );
        assert_eq!(
            run_value_exe(r#""C:\Program Files\Steam Game Idler\Steam Game Idler.exe" --flag"#),
            Some(exe.clone())
        );
        assert_eq!(
            run_value_exe(r"C:\Program Files\Steam Game Idler\Steam Game Idler.EXE --flag"),
            Some(PathBuf::from(
                r"C:\Program Files\Steam Game Idler\Steam Game Idler.EXE"
            ))
        );
        // `.exe` inside a folder name isn't the end of the path.
        assert_eq!(
            run_value_exe(r"D:\my.exetools\Steam Game Idler.exe"),
            Some(PathBuf::from(r"D:\my.exetools\Steam Game Idler.exe"))
        );
        assert_eq!(run_value_exe("no exe here"), None);
        assert_eq!(run_value_exe(r#""""#), None);
    }

    #[test]
    fn autostart_value_round_trips() {
        let exe = Path::new(r"C:\Users\me\AppData\Local\Steam Game Idler\Steam Game Idler.exe");
        let value = autostart_run_value(exe);
        assert_eq!(
            value,
            r"C:\Users\me\AppData\Local\Steam Game Idler\Steam Game Idler.exe "
        );
        assert_eq!(run_value_exe(&value).as_deref(), Some(exe));
    }

    #[test]
    // Windows-only: these rely on drive-letter paths, which std::path on Linux (where CI runs)
    // treats as one plain file name.
    #[cfg(windows)]
    fn repoints_only_old_or_missing_sgi_exes() {
        let current = Path::new(r"C:\Users\me\AppData\Local\Steam Game Idler\Steam Game Idler.exe");
        let legacy = Path::new(r"C:\Program Files\Steam Game Idler\Steam Game Idler.exe");
        let portable = Path::new(r"D:\Portable SGI\Steam Game Idler.exe");

        assert!(!should_repoint(current, current, Some(legacy), true));
        assert!(should_repoint(legacy, current, Some(legacy), true));
        // After a cleanup there's no legacy install to compare against, but the old exe is gone.
        assert!(should_repoint(legacy, current, None, false));
        // A portable copy that still exists is the user's choice; one that's gone isn't.
        assert!(!should_repoint(portable, current, Some(legacy), true));
        assert!(should_repoint(portable, current, None, false));
        // Some other app's missing exe is never ours to take over.
        assert!(!should_repoint(
            Path::new(r"C:\Other\Other.exe"),
            current,
            None,
            false
        ));
    }

    #[test]
    // Windows-only: these rely on drive-letter paths, which std::path on Linux (where CI runs)
    // treats as one plain file name.
    #[cfg(windows)]
    fn rejects_implausible_install_dirs() {
        let protected = [
            PathBuf::from(r"C:\Windows"),
            PathBuf::from(r"C:\Program Files"),
        ];
        assert!(is_plausible_install_dir(
            Path::new(r"C:\Program Files\Steam Game Idler"),
            &protected
        ));
        assert!(is_plausible_install_dir(Path::new(r"D:\Tools"), &protected));
        assert!(!is_plausible_install_dir(Path::new(r"C:\"), &protected));
        assert!(!is_plausible_install_dir(
            Path::new(r"c:\program files\"),
            &protected
        ));
        assert!(!is_plausible_install_dir(
            Path::new(r"C:\Windows"),
            &protected
        ));
        assert!(!is_plausible_install_dir(
            Path::new(r"relative\dir"),
            &protected
        ));
    }

    #[test]
    // Windows-only: these rely on drive-letter paths, which std::path on Linux (where CI runs)
    // treats as one plain file name.
    #[cfg(windows)]
    fn accepts_only_the_expected_result_file() {
        assert!(is_valid_result_path(Path::new(
            r"C:\Users\me\AppData\Roaming\com.zevnda.steam-game-idler\cache\legacy-install-cleanup.json"
        )));
        assert!(!is_valid_result_path(Path::new(
            r"C:\Windows\System32\drivers\etc\hosts"
        )));
        assert!(!is_valid_result_path(Path::new(
            "legacy-install-cleanup.json"
        )));
    }
}
