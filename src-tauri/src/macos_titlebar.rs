//! Positions the native traffic lights over the custom 56px titlebar (`Titlebar.tsx`).
//!
//! `WebviewWindowBuilder::traffic_light_position` only applies the inset once at creation (and
//! from a `drawRect:` the full-window webview never triggers), so AppKit's own title bar layout -
//! on show, resize, focus changes - puts the buttons straight back at their default spot. This
//! re-applies the same inset wry/tao use, from the window events that cause that relayout.

use objc2_app_kit::{NSView, NSWindow, NSWindowButton, NSWindowStyleMask};

/// Left edge of the close button, and the vertical center of the 56px titlebar, in points.
const LEFT_INSET: f64 = 20.0;
const TITLEBAR_CENTER_Y: f64 = 28.0;

pub fn apply(window: &tauri::WebviewWindow) {
    let window_for_main = window.clone();
    let result = window.run_on_main_thread(move || {
        let Ok(ns_window) = window_for_main.ns_window() else {
            return;
        };
        // SAFETY: `ns_window()` is the live NSWindow backing this Tauri window, and AppKit view
        // mutations below run on the main thread (`run_on_main_thread`).
        unsafe { inset(&*(ns_window as *const NSWindow)) };
    });
    if let Err(err) = result {
        tracing::warn!(
            ?err,
            "macos_titlebar: failed to schedule traffic light inset"
        );
    }
}

/// Same approach as wry's `inset_traffic_lights`: grow the title bar container so the buttons
/// (which keep their default offset from its bottom edge) end up centered on the custom titlebar,
/// then shift them right.
unsafe fn inset(window: &NSWindow) {
    // In native fullscreen the buttons live in AppKit's own toolbar window; moving them there
    // pushes them out of view (tao skips fullscreen too). Leaving fullscreen fires `Resized` again.
    if window.styleMask().contains(NSWindowStyleMask::FullScreen) {
        return;
    }
    let buttons: Vec<_> = [
        NSWindowButton::CloseButton,
        NSWindowButton::MiniaturizeButton,
        NSWindowButton::ZoomButton,
    ]
    .into_iter()
    .filter_map(|kind| window.standardWindowButton(kind))
    .collect();
    let [close, miniaturize, ..] = buttons.as_slice() else {
        return;
    };
    let Some(container) = close.superview().and_then(|view| view.superview()) else {
        return;
    };

    let close_rect = NSView::frame(close);
    let height = TITLEBAR_CENTER_Y + close_rect.size.height / 2.0 + close_rect.origin.y;
    let mut container_rect = NSView::frame(&container);
    container_rect.size.height = height;
    container_rect.origin.y = window.frame().size.height - height;
    container.setFrame(container_rect);

    let spacing = NSView::frame(miniaturize).origin.x - close_rect.origin.x;
    for (i, button) in buttons.iter().enumerate() {
        let mut origin = NSView::frame(button).origin;
        origin.x = LEFT_INSET + i as f64 * spacing;
        button.setFrameOrigin(origin);
    }
}
