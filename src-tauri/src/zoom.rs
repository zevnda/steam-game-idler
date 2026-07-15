//! Webview zoom control - backs the frontend's Ctrl+/Ctrl-/Ctrl+0/Ctrl+scroll shortcuts
//! (`useZoomControls.ts`). Zoom level is a frontend preference persisted to `localStorage`, not
//! `settings.json` - this command only ever applies whatever level the frontend already knows.

use crate::error::{AppError, AppResult};

/// Sets the WebView2 zoom factor directly via its native controller - there's no portable
/// `tauri::Webview` zoom API, so `unsafe` `windows`-crate `ICoreWebView2Controller::SetZoomFactor`
/// is the actual mechanism, not a workaround.
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
        })
        .map_err(|e| AppError::ZoomFactorFailed(e.to_string()))
}
