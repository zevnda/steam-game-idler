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
            // Host GTK input-method modules can link against a different GLib/GTK than what's
            // bundled inside the AppImage, causing load failures - restrict to the builtin module.
            if std::env::var_os("GTK_IM_MODULE").is_none() {
                unsafe {
                    std::env::set_var("GTK_IM_MODULE", "gtk-im-context-simple");
                }
            }
        }
    }

    steam_game_idler_lib::run();
}
