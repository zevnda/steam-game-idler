//! Webview zoom control - backs the frontend's Ctrl+/Ctrl-/Ctrl+0/Ctrl+scroll shortcuts
//! (`useZoomControls.ts`). Zoom level is a frontend preference persisted to `localStorage`, not
//! `settings.json` - this command only ever applies whatever level the frontend already knows.

use crate::error::{AppError, AppResult};

/// Sets the native webview's zoom factor directly - there's no portable `tauri::Webview` zoom
/// API. Windows goes through `unsafe` `windows`-crate `ICoreWebView2Controller::SetZoomFactor`;
/// Linux's WebKitGTK has no "controller" concept for this, so it sets the zoom level directly on
/// the underlying `webkit2gtk::WebView` widget instead - same user-visible effect, different
/// native mechanism per platform.
#[tauri::command]
pub fn set_zoom(webview: tauri::Webview, scale_factor: f64) -> AppResult<()> {
    webview
        .with_webview(move |webview| {
            #[cfg(windows)]
            unsafe {
                if let Err(e) = webview.controller().SetZoomFactor(scale_factor) {
                    tracing::warn!(error = %e, scale_factor, "failed to set webview zoom factor");
                }
            }

            #[cfg(target_os = "linux")]
            {
                use webkit2gtk::WebViewExt;
                webview.inner().set_zoom_level(scale_factor);
            }
        })
        .map_err(|e| AppError::ZoomFactorFailed(e.to_string()))
}
