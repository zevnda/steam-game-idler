#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // EXPERIMENTAL, untested on real hardware: try to let the AppImage run under native Wayland
    // instead of the XWayland compatibility layer linuxdeploy-plugin-gtk's bundled AppRun script
    // forces by default (the cause of the AppImage's known lag vs .deb/.rpm - see quirks.md and
    // .claude/cross-platform/appimage-egl-wayland-research.md, the koala73/worldmonitor#395
    // reference implementation this is adapted from).
    //
    // AppRun already sets GDK_BACKEND=x11 unconditionally before exec'ing this binary (confirmed
    // in quirks.md), so unlike the upstream reference implementation - which only fills in an
    // *unset* GDK_BACKEND - this deliberately overrides whatever value was inherited, otherwise
    // this code would be a silent no-op for our AppImage specifically.
    //
    // Known open risk: this project already hit a case (WEBKIT_DISABLE_COMPOSITING_MODE, see
    // quirks.md's "`std::env::set_var()` inside `run()` was too late" entry) where setting an env
    // var this early was still too late, because WebKitGTK's own library-load-time init runs
    // *before* main()'s first instruction, during dynamic linking - only a full process re-exec
    // fixed that one. GDK_BACKEND is a different variable, read by GTK at gtk_init()/gdk_init()
    // call time per GTK's own documented behavior, not via a load-time constructor - and the
    // external reference implementation this is based on does not use a re-exec - but that timing
    // assumption has not been independently confirmed against this project's own Tauri/wry version.
    // If this appears to have no effect (AppImage still laggy, no crash) rather than either fixing
    // or visibly breaking anything, that is the same class of timing bug as before, not proof this
    // approach "just doesn't help" - check with `strace`/timing diagnostics before concluding either
    // way, the same lesson quirks.md already logged once.
    #[cfg(not(windows))]
    {
        #[cfg(target_os = "linux")]
        appimage_prefer_system_libraries();

        if std::env::var_os("WAYLAND_DISPLAY").is_some() {
            // SAFETY: single-threaded at this point, before Tauri's own setup or any other code
            // that could race on the environment has run.
            unsafe {
                std::env::set_var("GDK_BACKEND", "wayland,x11");
            }
        }

        // AppImage-only from here down, gated on the same APPIMAGE env var
        // platform::can_auto_update() already keys off of - a .deb/.rpm install never sets this.
        if std::env::var_os("APPIMAGE").is_some() {
            // WebKitGTK's bubblewrap sandbox can fail inside an AppImage's FUSE mount, producing a
            // blank/white window instead of a crash - the AppImage's own execution environment
            // already provides isolation, so the extra sandbox layer is redundant here.
            if std::env::var_os("WEBKIT_FORCE_SANDBOX").is_none() {
                unsafe {
                    std::env::set_var("WEBKIT_FORCE_SANDBOX", "0");
                }
            }
            // Force the builtin input method when GTK_IM_MODULE is unset or set only to xim.
            // A plain Xfce/X11 session can export xim with no ibus/fcitx running, which broke keyboard input entirely.
            let im_module = std::env::var_os("GTK_IM_MODULE");
            let should_override_im_module = match im_module.as_deref().and_then(|v| v.to_str()) {
                None => true,
                Some(value) => value.split(':').all(|m| m == "xim"),
            };
            if should_override_im_module {
                unsafe {
                    std::env::set_var("GTK_IM_MODULE", "gtk-im-context-simple");
                }
            }
        }
    }

    steam_game_idler_lib::run();
}

/// When running as an AppImage on a system that has its own WebKitGTK 4.1, re-exec once with the
/// system library directories searched *before* the AppImage's bundled ones, so the app runs on
/// the host's WebKitGTK/GTK stack the same way the .deb/.rpm builds do.
///
/// Why: the AppImage is built on ubuntu-22.04 (to keep glibc 2.35 compatibility) and therefore
/// bundles a jammy WebKitGTK (pinned in release.yml), which renders far slower than a current
/// distro's 2.52+ - confirmed by VM testing to be the cause of the AppImage-vs-.deb lag (XWayland,
/// GIO and EGL were all ruled out; the bundled jammy atk-bridge mismatching a newer host's AT-SPI
/// made it worse). A host without WebKitGTK 4.1 keeps the bundled libraries exactly as before, so
/// nobody loses anything - `platform::needs_reduced_motion` then keeps animations reduced for them.
///
/// The bundled libraries are found via RUNPATH (`$ORIGIN`), which `LD_LIBRARY_PATH` normally
/// overrides - but linuxdeploy's AppRun *prepends* every bundled lib dir to `LD_LIBRARY_PATH`
/// before exec'ing us, so the system dirs have to be put in front of those. The dynamic loader
/// only reads `LD_LIBRARY_PATH` at process start, hence the re-exec rather than a plain
/// `set_var`. `exec` keeps the same PID, so the AppImage runtime keeps its FUSE mount alive and
/// single-instance enforcement (which runs later, in `run()`) never sees two processes.
///
/// The AppImage hook's module-path overrides (GTK/GIO/gdk-pixbuf/GStreamer) are dropped as well,
/// so the system's GTK and GStreamer load their own matching modules rather than jammy-built ones -
/// the same environment a .deb install runs in. The bundled lib dirs stay in `LD_LIBRARY_PATH`
/// after the system ones, as a per-library fallback for anything the host doesn't ship.
///
/// Skipped entirely while the NVIDIA proprietary driver is loaded: on NVIDIA + Wayland (KDE
/// Plasma 6, CachyOS host WebKitGTK 2.54) the host-library path crashed on startup with
/// "Error 71 (Protocol error) dispatching to Wayland display", and the usual workarounds either
/// left the UI transparent (`WEBKIT_DISABLE_DMABUF_RENDERER=1`) or flickering
/// (`__NV_DISABLE_EXPLICIT_SYNC=1`). The bundled libraries ran cleanly with neither, as did every
/// release before this re-exec existed (issue #2163). NVIDIA users therefore keep the pre-6.2.9
/// behavior - slower bundled WebKitGTK, animations reduced - which works rather than crashes.
///
/// Set `SGI_APPIMAGE_BUNDLED_LIBS=1` to skip this and force the bundled libraries (troubleshooting).
#[cfg(target_os = "linux")]
fn appimage_prefer_system_libraries() {
    use std::os::unix::process::CommandExt;
    use std::path::Path;

    // Set on the re-exec'd process so this only ever runs once.
    const REEXEC_MARKER: &str = "SGI_APPIMAGE_SYSTEM_LIBS";
    const OPT_OUT: &str = "SGI_APPIMAGE_BUNDLED_LIBS";
    // Set (instead of re-exec'ing) when the NVIDIA check below kept the bundled libraries, so
    // platform::log_runtime_environment can say why.
    const NVIDIA_MARKER: &str = "SGI_APPIMAGE_NVIDIA_BUNDLED";
    // Only exists while the NVIDIA proprietary kernel module is loaded - not for nouveau/NVK,
    // which go through Mesa like every other GPU and weren't part of the #2163 report.
    const NVIDIA_DRIVER_PROC: &str = "/proc/driver/nvidia/version";
    // Debian/Ubuntu multiarch, Fedora/openSUSE lib64, Arch/SteamOS plain lib. Only dirs that exist
    // are used; duplicates via /lib -> /usr/lib symlinks are harmless.
    const SYSTEM_LIB_DIRS: &[&str] = &[
        "/usr/lib/x86_64-linux-gnu",
        "/lib/x86_64-linux-gnu",
        "/usr/lib64",
        "/lib64",
        "/usr/lib",
    ];
    // Set by linuxdeploy-plugin-gtk's / linuxdeploy-plugin-gstreamer's AppRun hooks, or by AppRun
    // itself, to point at jammy-built modules inside the AppImage. AppRun sets the *unversioned*
    // GST_PLUGIN_SYSTEM_PATH (to a nonexistent `$APPDIR/usr/lib/gstreamer`) on top of the hook's
    // `_1_0` variant - drop only the `_1_0` one and GStreamer falls back to the unversioned one,
    // scans zero plugins, and WebKitWebProcess crashes on startup ("appsink not found").
    const HOOK_MODULE_VARS: &[&str] = &[
        "GTK_PATH",
        "GTK_EXE_PREFIX",
        "GTK_DATA_PREFIX",
        "GTK_IM_MODULE_FILE",
        "GDK_PIXBUF_MODULE_FILE",
        "GIO_MODULE_DIR",
        "GSETTINGS_SCHEMA_DIR",
        "GST_PLUGIN_PATH_1_0",
        "GST_PLUGIN_SYSTEM_PATH_1_0",
        "GST_PLUGIN_SCANNER_1_0",
        "GST_PTP_HELPER_1_0",
        "GST_REGISTRY_REUSE_PLUGIN_SCANNER",
        "GST_PLUGIN_PATH",
        "GST_PLUGIN_SYSTEM_PATH",
        "GST_PLUGIN_SCANNER",
    ];

    if std::env::var_os("APPIMAGE").is_none()
        || std::env::var_os(REEXEC_MARKER).is_some()
        || std::env::var_os(OPT_OUT).is_some()
    {
        return;
    }

    if Path::new(NVIDIA_DRIVER_PROC).exists() {
        // SAFETY: single-threaded at this point (called first thing in main()).
        unsafe {
            std::env::set_var(NVIDIA_MARKER, "1");
        }
        return;
    }

    let system_dirs: Vec<&str> = SYSTEM_LIB_DIRS
        .iter()
        .copied()
        .filter(|dir| Path::new(dir).is_dir())
        .collect();
    let has_system_webkit = system_dirs
        .iter()
        .any(|dir| Path::new(dir).join("libwebkit2gtk-4.1.so.0").exists());
    if !has_system_webkit {
        return;
    }

    let mut library_path = system_dirs.join(":");
    if let Some(existing) = std::env::var_os("LD_LIBRARY_PATH") {
        library_path.push(':');
        library_path.push_str(&existing.to_string_lossy());
    }

    // The resolved path, not `/proc/self/exe` itself - exec'ing the symlink path names the new
    // process `exe` (comm comes from the exec'd path's basename), so it'd show up as "exe" in
    // system monitors and `pgrep steam-game-idler` would stop finding it.
    let exe = match std::env::current_exe() {
        Ok(exe) => exe,
        Err(err) => {
            eprintln!("appimage: couldn't resolve own executable, using bundled libraries: {err}");
            return;
        }
    };

    let mut args = std::env::args_os();
    let arg0 = args.next().unwrap_or_else(|| "steam-game-idler".into());
    let mut command = std::process::Command::new(exe);
    command
        .arg0(arg0)
        .args(args)
        .env("LD_LIBRARY_PATH", library_path)
        .env(REEXEC_MARKER, "1");
    for var in HOOK_MODULE_VARS {
        command.env_remove(var);
    }

    // `exec` only returns on failure. Logging isn't initialized yet (that happens in `run()`), so
    // report on stderr and carry on with the bundled libraries rather than failing to start.
    let err = command.exec();
    eprintln!("appimage: failed to re-exec with system libraries, using bundled ones: {err}");
}
