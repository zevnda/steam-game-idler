use base64::Engine;
use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use lazy_static::lazy_static;
use regex::Regex;
use reqwest::Client;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::os::windows::process::CommandExt;
use std::sync::Mutex;
use std::time::Duration;
use steamlocate::SteamDir;
use sysinfo::{ProcessesToUpdate, System};
use tauri::Emitter;
use tauri::Manager;

pub struct DrpClient(pub Mutex<Option<(DiscordIpcClient, i64)>>);

lazy_static! {
    static ref LAST_KNOWN_TITLES: Mutex<HashMap<String, String>> = Mutex::new(HashMap::new());
}

#[tauri::command]
pub async fn is_dev() -> bool {
    cfg!(debug_assertions)
}

#[tauri::command]
pub async fn start_drp(state: tauri::State<'_, DrpClient>) -> Result<(), String> {
    let mut guard = state.inner().0.lock().unwrap();

    let start_ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;

    let mut client = DiscordIpcClient::new("1504784412288483408");
    client.connect().map_err(|e| e.to_string())?;

    let payload = activity::Activity::new()
        .activity_type(activity::ActivityType::Competing)
        .details("On the dashboard")
        .state("Viewing their games list")
        .timestamps(activity::Timestamps::new().start(start_ts))
        .buttons(vec![
            activity::Button::new("Download", "https://www.steamgameidler.com"),
            activity::Button::new("GitHub", "https://github.com/zevnda/steam-game-idler"),
        ]);
    client.set_activity(payload).map_err(|e| e.to_string())?;

    *guard = Some((client, start_ts));
    Ok(())
}

#[tauri::command]
pub async fn update_drp(
    drp_state: tauri::State<'_, DrpClient>,
    details: Option<String>,
    state: Option<String>,
) -> Result<(), String> {
    let mut guard = drp_state.inner().0.lock().unwrap();
    if let Some((client, start_ts)) = guard.as_mut() {
        let mut payload = activity::Activity::new()
            .activity_type(activity::ActivityType::Competing)
            .timestamps(activity::Timestamps::new().start(*start_ts))
            .buttons(vec![
                activity::Button::new("Download", "https://www.steamgameidler.com"),
                activity::Button::new("GitHub", "https://github.com/zevnda/steam-game-idler"),
            ]);
        if let Some(ref d) = details {
            payload = payload.details(d);
        } else {
            payload = payload.details("On the dashboard");
        }
        if let Some(ref s) = state {
            payload = payload.state(s);
        } else {
            payload = payload.state("Viewing their games list");
        }
        client.set_activity(payload).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn stop_drp(state: tauri::State<'_, DrpClient>) -> Result<(), String> {
    let mut guard = state.inner().0.lock().unwrap();
    if let Some((mut client, _)) = guard.take() {
        let _ = client.clear_activity();
        let _ = client.close();
    }
    Ok(())
}

#[tauri::command]
pub async fn is_steam_running() -> bool {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);
    sys.processes()
        .values()
        .any(|proc| proc.name().eq_ignore_ascii_case("steam.exe"))
}

#[tauri::command]
pub async fn validate_session(
    sid: String,
    sls: String,
    sma: Option<String>,
    steamid: String,
) -> Result<Value, String> {
    let client = Client::new();

    // Construct the cookie value based on the provided parameters
    let cookie_value = match sma {
        Some(sma_val) => format!(
            "sessionid={}; steamLoginSecure={}; steamparental={}; steamMachineAuth{}={}",
            sid, sls, sma_val, steamid, sma_val
        ),
        None => format!("sessionid={}; steamLoginSecure={}", sid, sls),
    };

    // Send the request and handle the response
    let response = client
        .get("https://steamcommunity.com/?l=english")
        .header("Content-Type", "application/json")
        .header("Cookie", cookie_value)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let html = response.text().await.map_err(|e| e.to_string())?;

    let regex = Regex::new(
        r#"<div\s+class="popup_block_new"\s+id="account_dropdown"\s+style="display:\s*none;"#,
    )
    .map_err(|e| e.to_string())?;
    let regex_two = Regex::new(r#"<a\s+href="https://steamcommunity\.com/(id|profiles)/[^"]*"\s+data-miniprofile="\d+">([^<]+)</a>"#)
        .map_err(|e| e.to_string())?;

    // Check if the user is logged in based on the response HTML
    if let Some(_m) = regex.find(&html) {
        if let Some(captures) = regex_two.captures(&html) {
            Ok(json!({ "user": captures[2].to_string() }))
        } else {
            Ok(json!({ "error": "Not logged in" }))
        }
    } else {
        Ok(json!({ "error": "Not logged in" }))
    }
}

#[tauri::command]
pub async fn validate_steam_api_key(
    steam_id: String,
    api_key: Option<String>,
) -> Result<Value, String> {
    // Check if the API key exists
    let api_key = match api_key {
        Some(key) if !key.trim().is_empty() => key,
        _ => return Ok(json!({ "error": "Invalid or missing API key" })),
    };

    let url = format!(
        "https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key={}&steamids={}",
        api_key, steam_id
    );

    let client = Client::new();

    // Send the request and handle the response
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Value>().await {
                    Ok(body) => Ok(body),
                    Err(_) => Ok(json!({ "error": "Failed to decode API response" })),
                }
            } else {
                Ok(json!({ "error": "Invalid API key or unauthorized request" }))
            }
        }
        Err(_) => Ok(json!({ "error": "Failed to connect to Steam API" })),
    }
}

#[tauri::command]
pub async fn anti_away() -> Result<(), String> {
    // Execute a command to set Steam status to online
    std::process::Command::new("cmd")
        .args(&["/C", "start steam://friends/status/online"])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn open_file_explorer(path: String, app_handle: tauri::AppHandle) -> Result<(), String> {
    let cache_dir = get_cache_dir(&app_handle)?;

    // Open the file explorer and select the specified path
    std::process::Command::new("explorer")
        .args(["/select,", cache_dir.join(path).to_str().unwrap()])
        .creation_flags(0x08000000)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_tray_icon(default: bool) -> String {
    let icon_bytes: &[u8] = if default {
        include_bytes!("../icons/32x32.png")
    } else {
        include_bytes!("../icons/32x32_running.png")
    };
    base64::engine::general_purpose::STANDARD.encode(icon_bytes)
}

pub fn atomic_write_json<T: serde::Serialize>(path: &std::path::Path, value: &T) -> std::io::Result<()> {
    let json = serde_json::to_string_pretty(value)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    let tmp_path = path.with_extension("tmp");
    std::fs::write(&tmp_path, &json)?;
    std::fs::rename(&tmp_path, path)?;
    Ok(())
}

pub fn get_lib_path() -> Result<String, String> {
    // Get the current executable path
    let mut path = std::env::current_exe().map_err(|e| e.to_string())?;
    path.pop();
    path.push("libs");
    path.push("SteamUtility.exe");
    Ok(path.to_str().unwrap().to_string())
}

pub async fn get_steam_location() -> Result<String, steamlocate::Error> {
    let steam_dir = SteamDir::locate()?;
    let config_path = steam_dir.path().join("config").join("loginusers.vdf");
    Ok(config_path.display().to_string())
}

#[tauri::command]
pub fn is_portable() -> bool {
    // Always return false in development mode
    if cfg!(debug_assertions) {
        return false;
    }

    if let Ok(current_exe) = tauri::utils::platform::current_exe() {
        let mut installed_flag = current_exe.clone();
        installed_flag.pop();
        installed_flag.push(".installed");
        !installed_flag.exists()
    } else {
        true
    }
}

// Get the cache directory path as a string for frontend use
#[tauri::command]
pub fn get_cache_dir_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    get_cache_dir(&app_handle).map(|path| path.to_string_lossy().to_string())
}

// Get the base cache directory path based on whether the app is running in portable mode.
// In portable mode: returns exe_dir/cache
// In non-portable mode: returns app_data_dir/cache
pub fn get_cache_dir(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    if is_portable() {
        let mut exe_path = tauri::utils::platform::current_exe()
            .map_err(|e| format!("Failed to get current exe path: {}", e))?;
        exe_path.pop(); // Remove the .exe file name to get the directory
        Ok(exe_path.join("cache"))
    } else {
        app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))
            .map(|path| path.join("cache"))
    }
}

// Command to quit the application
#[tauri::command]
pub fn quit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

// Force the window onto a detected monitor (preferring the primary monitor) and center it.
// Used to recover windows that are stuck off-screen, e.g. after a monitor is unplugged.
pub fn recenter_window(window: &tauri::WebviewWindow) -> Result<(), String> {
    let _ = window.unminimize();

    let monitor = window
        .primary_monitor()
        .map_err(|e| e.to_string())?
        .or_else(|| {
            window
                .available_monitors()
                .ok()
                .and_then(|monitors| monitors.into_iter().next())
        });

    if let Some(monitor) = monitor {
        let monitor_pos = monitor.position();
        let monitor_size = monitor.size();
        let window_size = window.outer_size().map_err(|e| e.to_string())?;

        let x = monitor_pos.x + (monitor_size.width as i32 - window_size.width as i32) / 2;
        let y = monitor_pos.y + (monitor_size.height as i32 - window_size.height as i32) / 2;

        window
            .set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
            .map_err(|e| e.to_string())?;
    }

    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}

// Command to set the zoom level of the webview
#[tauri::command]
pub fn set_zoom(webview: tauri::Webview, scale_factor: f64) -> Result<(), String> {
    webview
        .with_webview(move |webview| {
            #[cfg(windows)]
            unsafe {
                if let Err(e) = webview.controller().SetZoomFactor(scale_factor) {
                    eprintln!("Failed to set zoom factor: {}", e);
                }
            }
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

// Monitor and emit Steam running status changes
#[tauri::command]
pub async fn start_steam_status_monitor(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let mut last_status: Option<bool> = None;
        loop {
            let current_status = is_steam_running().await;
            if last_status != Some(current_status) {
                last_status = Some(current_status);
                let _ = app_handle.emit("steam_status_changed", current_status);
            }
            tokio::time::sleep(Duration::from_millis(1000)).await;
        }
    });
}

// Open a Steam login window, allow user to log in, and retrieve session cookies automatically
#[tauri::command]
pub async fn open_steam_login_window(app_handle: tauri::AppHandle) -> Result<Value, String> {
    use std::time::Duration;

    // Create a new window for Steam login (initially hidden)
    let window = tauri::webview::WebviewWindowBuilder::new(
        &app_handle,
        "steam-login",
        tauri::WebviewUrl::External(
            "https://steamcommunity.com/login/home/?goto="
                .parse()
                .unwrap(),
        ),
    )
    .title("Steam Login")
    .inner_size(800.0, 700.0)
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;

    // Wait a moment for webview to initialize
    tokio::time::sleep(Duration::from_millis(500)).await;

    // Check if we already have valid cookies
    if let Some(webview) = window.get_webview("steam-login") {
        if let Ok(cookies) =
            webview.cookies_for_url(tauri::Url::parse("https://steamcommunity.com/").unwrap())
        {
            let mut sessionid = None;
            let mut steam_login_secure = None;

            for cookie in cookies {
                if cookie.name() == "sessionid" {
                    sessionid = Some(cookie.value().to_string());
                }
                if cookie.name() == "steamLoginSecure" {
                    steam_login_secure = Some(cookie.value().to_string());
                }
            }

            // If we already have both cookies, return them immediately without showing window
            if let (Some(sid), Some(sls)) = (sessionid, steam_login_secure) {
                let _ = window.close();
                return Ok(serde_json::json!({
                    "success": true,
                    "sessionid": sid,
                    "steamLoginSecure": sls
                }));
            }
        }
    }

    // No valid cookies found, show the window for user to log in
    window.show().map_err(|e| e.to_string())?;

    // Listen for window close event
    let window_clone = window.clone();
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);

    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
            let _ = tx.try_send(());
        }
    });

    // Poll for cookies from the Rust side using the webview cookie manager
    let start = std::time::Instant::now();
    loop {
        // Check if window was closed
        if rx.try_recv().is_ok() {
            return Ok(serde_json::json!({
                "success": false,
                "message": "Login window closed"
            }));
        }

        if start.elapsed() > Duration::from_secs(300) {
            let _ = window_clone.close();
            return Ok(serde_json::json!({
                "success": false,
                "message": "Login timed out"
            }));
        }

        // Get cookies from the webview
        if let Some(webview) = window_clone.get_webview("steam-login") {
            // Get all cookies
            if let Ok(cookies) =
                webview.cookies_for_url(tauri::Url::parse("https://steamcommunity.com/").unwrap())
            {
                let mut sessionid = None;
                let mut steam_login_secure = None;

                for cookie in cookies {
                    if cookie.name() == "sessionid" {
                        sessionid = Some(cookie.value().to_string());
                    }
                    if cookie.name() == "steamLoginSecure" {
                        steam_login_secure = Some(cookie.value().to_string());
                    }
                }

                // Check if we have both cookies
                if let (Some(sid), Some(sls)) = (sessionid, steam_login_secure) {
                    let _ = window_clone.close();
                    return Ok(serde_json::json!({
                        "success": true,
                        "sessionid": sid,
                        "steamLoginSecure": sls
                    }));
                }
            }
        } else {
            // Window or webview no longer exists
            return Ok(serde_json::json!({
                "success": false,
                "message": "Login window closed"
            }));
        }

        tokio::time::sleep(Duration::from_millis(500)).await;
    }
}

// Delete Steam login window cookies to sign out the user
#[tauri::command]
pub async fn delete_login_window_cookies(app_handle: tauri::AppHandle) -> Result<Value, String> {
    // Create a hidden window
    let window = tauri::webview::WebviewWindowBuilder::new(
        &app_handle,
        "steam-logout",
        tauri::WebviewUrl::External("https://steamcommunity.com/".parse().unwrap()),
    )
    .title("Steam Logout")
    .inner_size(0.0, 0.0)
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;

    // Wait for webview to fully initialize
    tokio::time::sleep(Duration::from_millis(1500)).await;

    if let Some(webview) = window.get_webview("steam-logout") {
        // Get all cookies first
        let cookies = webview.cookies().map_err(|e| e.to_string())?;

        for cookie in cookies {
            webview
                .delete_cookie(cookie.clone())
                .map_err(|e| e.to_string())?;
        }

        // Wait a moment for deletion to complete
        tokio::time::sleep(Duration::from_millis(500)).await;

        // Verify deletion
        let remaining_cookies = webview.cookies().map_err(|e| e.to_string())?;
        let mut found_sessionid = false;
        let mut found_steam_login_secure = false;

        for cookie in remaining_cookies {
            if cookie.name() == "sessionid" {
                found_sessionid = true;
            }
            if cookie.name() == "steamLoginSecure" {
                found_steam_login_secure = true;
            }
        }

        let _ = window.close();

        if found_sessionid || found_steam_login_secure {
            return Ok(serde_json::json!({
                "success": false,
                "message": "Failed to delete all cookies"
            }));
        }

        return Ok(serde_json::json!({
            "success": true,
            "message": "Cookies deleted successfully"
        }));
    }

    let _ = window.close();
    Err("Failed to get webview".to_string())
}

// Open a Steam store login window and retrieve session cookies automatically
#[tauri::command]
pub async fn open_store_login_window(app_handle: tauri::AppHandle) -> Result<Value, String> {
    use std::time::Duration;

    // Create a new window for Steam store login (initially hidden)
    let window = tauri::webview::WebviewWindowBuilder::new(
        &app_handle,
        "store-login",
        tauri::WebviewUrl::External(
            "https://store.steampowered.com/login/?redir=&redir_ssl=1"
                .parse()
                .unwrap(),
        ),
    )
    .title("Steam Store Login")
    .inner_size(800.0, 700.0)
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;

    // Wait a moment for webview to initialize
    tokio::time::sleep(Duration::from_millis(500)).await;

    // Check if we already have valid cookies
    if let Some(webview) = window.get_webview("store-login") {
        if let Ok(cookies) =
            webview.cookies_for_url(tauri::Url::parse("https://store.steampowered.com/").unwrap())
        {
            for cookie in cookies {
                if cookie.name() == "steamLoginSecure" {
                    let _ = window.close();
                    return Ok(serde_json::json!({
                        "success": true,
                        "steamLoginSecure": cookie.value().to_string()
                    }));
                }
            }
        }
    }

    // No valid cookies found, show the window for user to log in
    window.show().map_err(|e| e.to_string())?;

    // Listen for window close event
    let window_clone = window.clone();
    let (tx, mut rx) = tokio::sync::mpsc::channel(1);

    window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
            let _ = tx.try_send(());
        }
    });

    // Poll for cookies from the Rust side using the webview cookie manager
    let start = std::time::Instant::now();
    loop {
        // Check if window was closed
        if rx.try_recv().is_ok() {
            return Ok(serde_json::json!({
                "success": false,
                "message": "Login window closed"
            }));
        }

        if start.elapsed() > Duration::from_secs(300) {
            let _ = window_clone.close();
            return Ok(serde_json::json!({
                "success": false,
                "message": "Login timed out"
            }));
        }

        // Get cookies from the webview
        if let Some(webview) = window_clone.get_webview("store-login") {
            if let Ok(cookies) = webview
                .cookies_for_url(tauri::Url::parse("https://store.steampowered.com/").unwrap())
            {
                for cookie in cookies {
                    if cookie.name() == "steamLoginSecure" {
                        let _ = window_clone.close();
                        return Ok(serde_json::json!({
                            "success": true,
                            "steamLoginSecure": cookie.value().to_string()
                        }));
                    }
                }
            }
        } else {
            // Window or webview no longer exists
            return Ok(serde_json::json!({
                "success": false,
                "message": "Login window closed"
            }));
        }

        tokio::time::sleep(Duration::from_millis(500)).await;
    }
}

// Delete Steam store cookies to sign out the user
#[tauri::command]
pub async fn delete_store_cookies(app_handle: tauri::AppHandle) -> Result<Value, String> {
    // Create a hidden window
    let window = tauri::webview::WebviewWindowBuilder::new(
        &app_handle,
        "store-logout",
        tauri::WebviewUrl::External("https://store.steampowered.com/".parse().unwrap()),
    )
    .title("Steam Store Logout")
    .inner_size(0.0, 0.0)
    .visible(false)
    .build()
    .map_err(|e| e.to_string())?;

    // Wait for webview to fully initialize
    tokio::time::sleep(Duration::from_millis(1500)).await;

    if let Some(webview) = window.get_webview("store-logout") {
        // Get cookies for store domain
        let cookies = webview
            .cookies_for_url(tauri::Url::parse("https://store.steampowered.com/").unwrap())
            .map_err(|e| e.to_string())?;

        // Delete sessionid and steamLoginSecure cookies
        for cookie in cookies {
            if cookie.name() == "sessionid" || cookie.name() == "steamLoginSecure" {
                webview
                    .delete_cookie(cookie.clone())
                    .map_err(|e| e.to_string())?;
            }
        }

        // Wait a moment for deletion to complete
        tokio::time::sleep(Duration::from_millis(500)).await;

        // Verify deletion
        let remaining_cookies = webview
            .cookies_for_url(tauri::Url::parse("https://store.steampowered.com/").unwrap())
            .map_err(|e| e.to_string())?;
        let mut found_sessionid = false;
        let mut found_steam_login_secure = false;

        for cookie in remaining_cookies {
            if cookie.name() == "sessionid" {
                found_sessionid = true;
            }
            if cookie.name() == "steamLoginSecure" {
                found_steam_login_secure = true;
            }
        }

        let _ = window.close();

        if found_sessionid || found_steam_login_secure {
            return Ok(serde_json::json!({
                "success": false,
                "message": "Failed to delete all cookies"
            }));
        }

        return Ok(serde_json::json!({
            "success": true,
            "message": "Cookies deleted successfully"
        }));
    }

    let _ = window.close();
    Err("Failed to get webview".to_string())
}

#[tauri::command]
pub fn update_tray_menu(
    app: tauri::AppHandle,
    show: String,
    recenter: String,
    update: String,
    quit: String,
) -> Result<(), String> {
    use tauri::menu::{Menu, MenuItem};

    let show_item =
        MenuItem::with_id(&app, "show", &show, true, None::<&str>).map_err(|e| e.to_string())?;
    let recenter_item = MenuItem::with_id(&app, "recenter", &recenter, true, None::<&str>)
        .map_err(|e| e.to_string())?;
    let quit_item =
        MenuItem::with_id(&app, "quit", &quit, true, None::<&str>).map_err(|e| e.to_string())?;

    let menu = if !is_portable() {
        let update_item = MenuItem::with_id(&app, "update", &update, true, None::<&str>)
            .map_err(|e| e.to_string())?;
        Menu::with_items(&app, &[&show_item, &recenter_item, &update_item, &quit_item])
            .map_err(|e| e.to_string())?
    } else {
        Menu::with_items(&app, &[&show_item, &recenter_item, &quit_item])
            .map_err(|e| e.to_string())?
    };

    if let Some(tray) = app.tray_by_id("1") {
        tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    }

    Ok(())
}

// Update AllowAutoLogin, MostRecent, and Timestamp fields in loginusers.vdf
fn update_login_users_vdf(
    content: &str,
    target_steam_id: &str,
    timestamp: u64,
) -> Result<(String, String), String> {
    let mut output = String::new();
    let mut depth: i32 = 0;
    let mut current_user_id = String::new();
    let mut pending_block_key = String::new();
    let mut target_account_name = String::new();

    let block_key_re = Regex::new(r#"^\s*"([^"]*)"\s*$"#).map_err(|e| e.to_string())?;
    let kv_re = Regex::new(r#"^\s*"([^"]*)"\s+"([^"]*)"\s*$"#).map_err(|e| e.to_string())?;

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed == "{" {
            depth += 1;
            if depth == 2 && !pending_block_key.is_empty() {
                current_user_id = pending_block_key.clone();
            }
            pending_block_key.clear();
            output.push_str(line);
            output.push('\n');
        } else if trimmed == "}" {
            if depth == 2 {
                current_user_id.clear();
            }
            depth -= 1;
            output.push_str(line);
            output.push('\n');
        } else if let Some(kv_cap) = kv_re.captures(line) {
            let key = &kv_cap[1];
            let value = &kv_cap[2];
            let is_target = current_user_id == target_steam_id;
            let leading = &line[..line.len() - line.trim_start().len()];

            if depth == 2 {
                match key {
                    "AccountName" => {
                        if is_target {
                            target_account_name = value.to_string();
                        }
                        output.push_str(line);
                        output.push('\n');
                    }
                    "AllowAutoLogin" => {
                        let v = if is_target { "1" } else { "0" };
                        output.push_str(&format!("{}\"AllowAutoLogin\"\t\t\"{}\"\n", leading, v));
                    }
                    "MostRecent" => {
                        let v = if is_target { "1" } else { "0" };
                        output.push_str(&format!("{}\"MostRecent\"\t\t\"{}\"\n", leading, v));
                    }
                    "Timestamp" => {
                        let v = if is_target {
                            timestamp.to_string()
                        } else {
                            value.to_string()
                        };
                        output.push_str(&format!("{}\"Timestamp\"\t\t\"{}\"\n", leading, v));
                    }
                    _ => {
                        output.push_str(line);
                        output.push('\n');
                    }
                }
            } else {
                output.push_str(line);
                output.push('\n');
            }
        } else if let Some(bk_cap) = block_key_re.captures(line) {
            if depth == 1 {
                pending_block_key = bk_cap[1].to_string();
            }
            output.push_str(line);
            output.push('\n');
        } else {
            output.push_str(line);
            output.push('\n');
        }
    }

    if target_account_name.is_empty() {
        return Err(format!(
            "Steam ID {} not found in loginusers.vdf",
            target_steam_id
        ));
    }

    Ok((output, target_account_name))
}

// Locate and launch Steam without killing the existing process first
#[tauri::command]
pub async fn launch_steam() -> Result<(), String> {
    if let Ok(steam_dir) = SteamDir::locate() {
        let steam_exe = steam_dir.path().join("steam.exe");
        std::process::Command::new(&steam_exe)
            .creation_flags(0x08000000)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Write VDF + registry for the target account
#[tauri::command]
pub async fn prepare_steam_account_switch(steam_id: String) -> Result<(), String> {
    use std::time::{SystemTime, UNIX_EPOCH};

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let vdf_path = std::path::PathBuf::from(get_steam_location().await.map_err(|e| e.to_string())?);

    let content = std::fs::read_to_string(&vdf_path).map_err(|e| e.to_string())?;
    let (updated_content, account_name) = update_login_users_vdf(&content, &steam_id, timestamp)?;
    std::fs::write(&vdf_path, updated_content).map_err(|e| e.to_string())?;

    std::process::Command::new("reg")
        .args([
            "add",
            r"HKCU\Software\Valve\Steam",
            "/v",
            "AutoLoginUser",
            "/t",
            "REG_SZ",
            "/d",
            &account_name,
            "/f",
        ])
        .creation_flags(0x08000000)
        .output()
        .map_err(|e| e.to_string())?;

    Ok(())
}

// Kill Steam and relaunch it so the already-prepared account switch takes effect
#[tauri::command]
pub async fn switch_steam_account() -> Result<(), String> {
    // Kill Steam (ignore error if it wasn't running)
    let _ = std::process::Command::new("taskkill")
        .args(["/F", "/IM", "steam.exe"])
        .creation_flags(0x08000000)
        .output();

    // Give Steam time to fully shut down before restarting
    tokio::time::sleep(Duration::from_millis(2000)).await;

    if let Ok(steam_dir) = SteamDir::locate() {
        let steam_exe = steam_dir.path().join("steam.exe");
        let _ = std::process::Command::new(&steam_exe)
            .creation_flags(0x08000000)
            .spawn();
    }

    Ok(())
}

#[tauri::command]
pub async fn get_device_fingerprint() -> Result<String, String> {
    machine_uid::get().map_err(|e| e.to_string())
}
