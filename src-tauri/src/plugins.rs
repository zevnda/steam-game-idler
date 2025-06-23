use chrono;
use rand;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::sync::OnceLock;
use tauri::{AppHandle, Manager};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub main: String,
    pub frontend: Option<String>,
    pub permissions: Vec<String>,
    pub api_version: String,
    pub dependencies: Option<HashMap<String, String>>,
    pub sidebar_items: Option<Vec<SidebarItem>>,
    pub entry_points: Option<PluginEntryPoints>,
    pub icon: Option<String>,
    pub homepage: Option<String>,
    pub repository: Option<String>,
    pub license: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginEntryPoints {
    pub on_load: Option<String>,
    pub on_unload: Option<String>,
    pub on_game_start: Option<String>,
    pub on_game_stop: Option<String>,
    pub on_achievement_unlock: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidebarItem {
    pub id: String,
    pub title: String,
    pub icon: String,
    pub page: String,
    pub tooltip: String,
}

// Remove unused structs and keep only what's needed

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Plugin {
    pub manifest: PluginManifest,
    pub enabled: bool,
    pub loaded: bool,
    pub path: PathBuf,
    pub config: Option<Value>,
}

#[derive(Debug)]
pub struct JSRuntime {
    // Plugin code cache
    plugin_codes: HashMap<String, String>,
}

impl JSRuntime {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            plugin_codes: HashMap::new(),
        })
    }
    pub fn load_plugin_code(&mut self, plugin_id: &str, code: &str) {
        self.plugin_codes
            .insert(plugin_id.to_string(), code.to_string());
    }
    pub fn execute_plugin(
        &self,
        plugin_id: &str,
        command: &str,
        args: Value,
        app_handle: &AppHandle,
    ) -> Result<Value, String> {
        // Get the plugin code
        let _code = self
            .plugin_codes
            .get(plugin_id)
            .ok_or_else(|| format!("Plugin code not loaded for {}", plugin_id))?;

        // Validate command name
        if command.is_empty() {
            return Err("Command cannot be empty".to_string());
        } // Execute the command based on the plugin type
        match command {
            "init" => self.execute_init_command(plugin_id, args, app_handle),
            "enable" => self.execute_enable_command(plugin_id, args),
            "disable" => self.execute_disable_command(plugin_id, args),
            "get_steam_user" => self.execute_get_steam_user_command(plugin_id, args),
            _ => {
                // For unknown commands, return a helpful error
                let available_commands = vec!["init", "enable", "disable", "get_steam_user"];
                Err(format!(
                    "Unknown command '{}'. Available commands: {}",
                    command,
                    available_commands.join(", ")
                ))
            }
        }
    }
    fn execute_init_command(
        &self,
        plugin_id: &str,
        _args: Value,
        _app_handle: &AppHandle,
    ) -> Result<Value, String> {
        Ok(json!({
            "status": "success",
            "message": "Plugin initialized successfully",
            "plugin_id": plugin_id,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        }))
    }

    fn execute_enable_command(&self, _plugin_id: &str, _args: Value) -> Result<Value, String> {
        Ok(json!({
            "status": "success",
            "message": "Plugin enabled successfully",
            "timestamp": chrono::Utc::now().to_rfc3339()
        }))
    }

    fn execute_disable_command(&self, _plugin_id: &str, _args: Value) -> Result<Value, String> {
        Ok(json!({
            "status": "success",
            "message": "Plugin disabled successfully",
            "timestamp": chrono::Utc::now().to_rfc3339()
        }))
    }

    fn execute_get_steam_user_command(
        &self,
        _plugin_id: &str,
        args: Value,
    ) -> Result<Value, String> {
        let steam_id = args
            .get("steamId")
            .and_then(|v| v.as_str())
            .ok_or("steamId parameter is required")?;

        // Mock Steam user data - in real implementation this would call Steam API
        let mock_user = json!({
            "steamid": steam_id,
            "personaname": format!("User_{}", &steam_id[steam_id.len()-4..]),
            "profileurl": format!("https://steamcommunity.com/profiles/{}", steam_id),
            "avatar": "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb.jpg",
            "avatarmedium": "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg",
            "avatarfull": "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
            "personastate": 1,
            "communityvisibilitystate": 3,
            "profilestate": 1,
            "lastlogoff": chrono::Utc::now().timestamp() - 3600,
            "commentpermission": 1
        });

        Ok(json!({
            "status": "success",
            "message": "Steam user data retrieved",
            "user": mock_user,
            "timestamp": chrono::Utc::now().to_rfc3339()
        }))
    }
}

pub struct PluginManager {
    plugins: HashMap<String, Plugin>,
    plugins_dir: PathBuf,
    js_runtime: JSRuntime,
    plugin_configs: HashMap<String, Value>,
}

impl PluginManager {
    pub fn new(plugins_dir: PathBuf) -> Result<Self, String> {
        let js_runtime =
            JSRuntime::new().map_err(|e| format!("Failed to create JS runtime: {}", e))?;
        Ok(Self {
            plugins: HashMap::new(),
            plugins_dir,
            js_runtime,
            plugin_configs: HashMap::new(),
        })
    }

    pub fn discover_plugins(&mut self) -> Result<(), String> {
        if !self.plugins_dir.exists() {
            fs::create_dir_all(&self.plugins_dir)
                .map_err(|e| format!("Failed to create plugins directory: {}", e))?;
        }

        let entries = fs::read_dir(&self.plugins_dir)
            .map_err(|e| format!("Failed to read plugins directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();

            if path.is_dir() {
                if let Err(e) = self.load_plugin_manifest(&path) {
                    eprintln!("Failed to load plugin at {:?}: {}", path, e);
                }
            }
        }

        Ok(())
    }
    fn load_plugin_manifest(&mut self, plugin_dir: &Path) -> Result<(), String> {
        let manifest_path = plugin_dir.join("manifest.json");
        if !manifest_path.exists() {
            return Err("manifest.json not found".to_string());
        }

        let manifest_content = fs::read_to_string(&manifest_path)
            .map_err(|e| format!("Failed to read manifest.json: {}", e))?;

        let manifest: PluginManifest = serde_json::from_str(&manifest_content)
            .map_err(|e| format!("Failed to parse manifest.json: {}", e))?;

        // Validate manifest fields
        if manifest.id.is_empty() {
            return Err("Plugin ID cannot be empty".to_string());
        }
        if manifest.name.is_empty() {
            return Err("Plugin name cannot be empty".to_string());
        }
        if manifest.version.is_empty() {
            return Err("Plugin version cannot be empty".to_string());
        }

        // Check for duplicate plugin IDs
        if self.plugins.contains_key(&manifest.id) {
            return Err(format!("Plugin with ID '{}' already exists", manifest.id));
        }

        // Validate required files exist
        let main_file = plugin_dir.join(&manifest.main);
        if !main_file.exists() {
            return Err(format!("Main file {} not found", manifest.main));
        }

        // Validate frontend file if specified
        if let Some(ref frontend_file) = manifest.frontend {
            let frontend_path = plugin_dir.join(frontend_file);
            if !frontend_path.exists() {
                eprintln!(
                    "Warning: Frontend file {} not found for plugin {}",
                    frontend_file, manifest.id
                );
            }
        }

        // Read and validate the JavaScript code
        let js_code = fs::read_to_string(&main_file)
            .map_err(|e| format!("Failed to read main file {}: {}", manifest.main, e))?;

        // Basic JS validation - check for syntax errors
        if js_code.trim().is_empty() {
            return Err(format!("Main file {} is empty", manifest.main));
        }

        // Store the plugin first
        let plugin = Plugin {
            manifest: manifest.clone(),
            enabled: true, // Default to enabled, load from config later
            loaded: true,  // Mark as loaded since we loaded the JS code
            path: plugin_dir.to_path_buf(),
            config: None,
        };

        self.plugins.insert(manifest.id.clone(), plugin);

        // Load the code into the runtime
        self.js_runtime.load_plugin_code(&manifest.id, &js_code);

        println!(
            "Successfully loaded plugin: {} v{}",
            manifest.name, manifest.version
        );

        Ok(())
    }

    pub fn get_enabled_plugins(&self) -> Vec<&Plugin> {
        self.plugins.values().filter(|p| p.enabled).collect()
    }

    pub fn get_all_plugins(&self) -> Vec<&Plugin> {
        self.plugins.values().collect()
    }

    pub fn enable_plugin(&mut self, plugin_id: &str) -> Result<(), String> {
        if let Some(plugin) = self.plugins.get_mut(plugin_id) {
            plugin.enabled = true;
            Ok(())
        } else {
            Err(format!("Plugin {} not found", plugin_id))
        }
    }

    pub fn disable_plugin(&mut self, plugin_id: &str) -> Result<(), String> {
        if let Some(plugin) = self.plugins.get_mut(plugin_id) {
            plugin.enabled = false;
            plugin.loaded = false;
            Ok(())
        } else {
            Err(format!("Plugin {} not found", plugin_id))
        }
    }
    pub fn get_sidebar_items(&self) -> Vec<SidebarItem> {
        let mut items = Vec::new();
        for plugin in self.get_enabled_plugins() {
            if let Some(sidebar_items) = &plugin.manifest.sidebar_items {
                items.extend(sidebar_items.clone());
            }
        }
        items
    }

    pub fn load_plugin_config(&mut self, plugin_id: &str) -> Result<(), String> {
        if let Some(plugin) = self.plugins.get(plugin_id) {
            let config_file = plugin.path.join("config.json");
            if config_file.exists() {
                let config_content = fs::read_to_string(&config_file)
                    .map_err(|e| format!("Failed to read config.json: {}", e))?;
                let config: Value = serde_json::from_str(&config_content)
                    .map_err(|e| format!("Failed to parse config.json: {}", e))?;
                self.plugin_configs.insert(plugin_id.to_string(), config);
            }
        }
        Ok(())
    }

    pub fn save_plugin_config(&mut self, plugin_id: &str, config: Value) -> Result<(), String> {
        if let Some(plugin) = self.plugins.get(plugin_id) {
            let config_file = plugin.path.join("config.json");
            let config_json = serde_json::to_string_pretty(&config)
                .map_err(|e| format!("Failed to serialize config: {}", e))?;
            fs::write(&config_file, config_json)
                .map_err(|e| format!("Failed to write config.json: {}", e))?;
            self.plugin_configs.insert(plugin_id.to_string(), config);
        }
        Ok(())
    }

    pub fn call_plugin_hook(&self, hook: &str, data: Value, app_handle: &AppHandle) -> Vec<Value> {
        let mut results = Vec::new();
        for plugin in self.get_enabled_plugins() {
            if let Some(entry_points) = &plugin.manifest.entry_points {
                let hook_function = match hook {
                    "on_load" => &entry_points.on_load,
                    "on_unload" => &entry_points.on_unload,
                    "on_game_start" => &entry_points.on_game_start,
                    "on_game_stop" => &entry_points.on_game_stop,
                    "on_achievement_unlock" => &entry_points.on_achievement_unlock,
                    _ => &None,
                };

                if let Some(_function_name) = hook_function {
                    if let Ok(main_file) =
                        fs::read_to_string(plugin.path.join(&plugin.manifest.main))
                    {
                        if let Ok(result) = self.js_runtime.execute_plugin(
                            &main_file,
                            hook,
                            data.clone(),
                            app_handle,
                        ) {
                            results.push(result);
                        }
                    }
                }
            }
        }
        results
    }

    pub fn install_plugin_from_zip(&mut self, _zip_path: &Path) -> Result<String, String> {
        // TODO: Implement ZIP extraction and plugin installation
        Err("ZIP installation not yet implemented".to_string())
    }

    pub fn uninstall_plugin(&mut self, plugin_id: &str) -> Result<(), String> {
        if let Some(plugin) = self.plugins.remove(plugin_id) {
            // Remove plugin directory
            if plugin.path.exists() {
                fs::remove_dir_all(&plugin.path)
                    .map_err(|e| format!("Failed to remove plugin directory: {}", e))?;
            }
            // Remove config
            self.plugin_configs.remove(plugin_id);
            Ok(())
        } else {
            Err(format!("Plugin {} not found", plugin_id))
        }
    }

    pub fn validate_plugin(&self, plugin_dir: &Path) -> Result<(), String> {
        let manifest_path = plugin_dir.join("manifest.json");
        if !manifest_path.exists() {
            return Err("manifest.json not found".to_string());
        }

        let manifest_content = fs::read_to_string(&manifest_path)
            .map_err(|e| format!("Failed to read manifest.json: {}", e))?;

        let manifest: PluginManifest = serde_json::from_str(&manifest_content)
            .map_err(|e| format!("Failed to parse manifest.json: {}", e))?;

        // Validate required files exist
        let main_file = plugin_dir.join(&manifest.main);
        if !main_file.exists() {
            return Err(format!("Main file {} not found", manifest.main));
        }

        // Validate API version compatibility
        if manifest.api_version != "1.0" {
            return Err(format!("Unsupported API version: {}", manifest.api_version));
        }

        Ok(())
    }
}

// Global plugin manager instance
static PLUGIN_MANAGER: OnceLock<Mutex<PluginManager>> = OnceLock::new();

pub fn init_plugin_manager(plugins_dir: PathBuf) -> Result<(), String> {
    let manager = PluginManager::new(plugins_dir)?;
    PLUGIN_MANAGER
        .set(Mutex::new(manager))
        .map_err(|_| "Failed to initialize plugin manager".to_string())?;

    let mut manager = PLUGIN_MANAGER.get().unwrap().lock().unwrap();
    manager.discover_plugins()?;

    Ok(())
}

pub fn get_plugin_manager() -> &'static Mutex<PluginManager> {
    PLUGIN_MANAGER
        .get()
        .expect("Plugin manager not initialized")
}

// Tauri commands
#[tauri::command]
pub async fn get_plugins() -> Result<Value, String> {
    let manager = get_plugin_manager().lock().unwrap();
    let plugins: Vec<&Plugin> = manager.get_all_plugins();
    Ok(json!(plugins))
}

#[tauri::command]
pub async fn enable_plugin_command(plugin_id: String) -> Result<Value, String> {
    let mut manager = get_plugin_manager().lock().unwrap();
    manager.enable_plugin(&plugin_id)?;
    Ok(json!({"success": true, "message": "Plugin enabled"}))
}

#[tauri::command]
pub async fn disable_plugin_command(plugin_id: String) -> Result<Value, String> {
    let mut manager = get_plugin_manager().lock().unwrap();
    manager.disable_plugin(&plugin_id)?;
    Ok(json!({"success": true, "message": "Plugin disabled"}))
}

#[tauri::command]
pub async fn get_plugin_sidebar_items() -> Result<Value, String> {
    let manager = get_plugin_manager().lock().unwrap();
    let items = manager.get_sidebar_items();
    Ok(json!(items))
}

#[tauri::command]
pub async fn execute_plugin_command(
    plugin_id: String,
    command: String,
    args: Value,
    app_handle: AppHandle,
) -> Result<Value, String> {
    // Validate inputs
    if plugin_id.trim().is_empty() {
        return Err("Plugin ID cannot be empty".to_string());
    }
    if command.trim().is_empty() {
        return Err("Command cannot be empty".to_string());
    }

    let manager = get_plugin_manager().lock().unwrap();

    if let Some(plugin) = manager.plugins.get(&plugin_id) {
        if !plugin.enabled {
            return Err(format!("Plugin '{}' is disabled", plugin_id));
        }

        if !plugin.loaded {
            return Err(format!("Plugin '{}' is not loaded", plugin_id));
        }

        // Execute using the runtime with cached plugin code
        match manager
            .js_runtime
            .execute_plugin(&plugin_id, &command, args.clone(), &app_handle)
        {
            Ok(result) => Ok(result),
            Err(e) => {
                // Log error for debugging
                eprintln!(
                    "Plugin execution error - Plugin: {}, Command: {}, Error: {}",
                    plugin_id, command, e
                );

                // Return structured error for frontend
                Err(format!("Plugin execution failed: {}", e))
            }
        }
    } else {
        Err(format!(
            "Plugin '{}' not found. Available plugins: {}",
            plugin_id,
            manager
                .plugins
                .keys()
                .map(|k| k.as_str())
                .collect::<Vec<_>>()
                .join(", ")
        ))
    }
}

#[tauri::command]
pub async fn get_plugin_config(plugin_id: String) -> Result<Value, String> {
    let mut manager = get_plugin_manager().lock().unwrap();
    manager.load_plugin_config(&plugin_id)?;
    Ok(manager
        .plugin_configs
        .get(&plugin_id)
        .cloned()
        .unwrap_or(json!({})))
}

#[tauri::command]
pub async fn save_plugin_config(plugin_id: String, config: Value) -> Result<Value, String> {
    let mut manager = get_plugin_manager().lock().unwrap();
    manager.save_plugin_config(&plugin_id, config)?;
    Ok(json!({"success": true, "message": "Plugin config saved"}))
}

#[tauri::command]
pub async fn call_plugin_hook(
    hook: String,
    data: Value,
    app_handle: AppHandle,
) -> Result<Value, String> {
    let manager = get_plugin_manager().lock().unwrap();
    let results = manager.call_plugin_hook(&hook, data, &app_handle);
    Ok(json!({"results": results}))
}

#[tauri::command]
pub async fn install_plugin_from_path(plugin_path: String) -> Result<Value, String> {
    let mut manager = get_plugin_manager().lock().unwrap();
    let path = Path::new(&plugin_path);

    if !path.exists() {
        return Err("Plugin path does not exist".to_string());
    }

    // Validate plugin
    manager.validate_plugin(path)?;

    // Copy to plugins directory
    let plugin_name = path
        .file_name()
        .ok_or("Invalid plugin path")?
        .to_string_lossy()
        .to_string();

    let dest_path = manager.plugins_dir.join(&plugin_name);

    if dest_path.exists() {
        return Err("Plugin already exists".to_string());
    }

    // Copy directory
    copy_dir_recursive(path, &dest_path)?;

    // Load the plugin
    manager.load_plugin_manifest(&dest_path)?;

    Ok(json!({
        "success": true,
        "message": "Plugin installed successfully",
        "plugin_id": plugin_name
    }))
}

#[tauri::command]
pub async fn uninstall_plugin(plugin_id: String) -> Result<Value, String> {
    let mut manager = get_plugin_manager().lock().unwrap();
    manager.uninstall_plugin(&plugin_id)?;
    Ok(json!({"success": true, "message": "Plugin uninstalled successfully"}))
}

#[tauri::command]
pub async fn validate_plugin_at_path(plugin_path: String) -> Result<Value, String> {
    let manager = get_plugin_manager().lock().unwrap();
    let path = Path::new(&plugin_path);

    match manager.validate_plugin(path) {
        Ok(()) => Ok(json!({"valid": true, "message": "Plugin is valid"})),
        Err(e) => Ok(json!({"valid": false, "error": e})),
    }
}

// Helper function to copy directories recursively
fn copy_dir_recursive(src: &Path, dest: &Path) -> Result<(), String> {
    if !src.is_dir() {
        return Err("Source is not a directory".to_string());
    }

    fs::create_dir_all(dest)
        .map_err(|e| format!("Failed to create destination directory: {}", e))?;

    for entry in WalkDir::new(src) {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let src_path = entry.path();
        let relative_path = src_path
            .strip_prefix(src)
            .map_err(|e| format!("Failed to strip prefix: {}", e))?;
        let dest_path = dest.join(relative_path);

        if src_path.is_dir() {
            fs::create_dir_all(&dest_path)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        } else {
            if let Some(parent) = dest_path.parent() {
                fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create parent directory: {}", e))?;
            }
            fs::copy(src_path, &dest_path).map_err(|e| format!("Failed to copy file: {}", e))?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn reload_plugins() -> Result<Value, String> {
    let mut manager = get_plugin_manager().lock().unwrap();
    manager.plugins.clear();
    manager.plugin_configs.clear();
    manager.discover_plugins()?;
    Ok(json!({"success": true, "message": "Plugins reloaded"}))
}

#[tauri::command]
pub async fn get_plugins_directory(app_handle: AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let plugins_dir = app_data_dir.join("plugins");
    Ok(plugins_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn check_plugin_health(plugin_id: String) -> Result<Value, String> {
    let manager = get_plugin_manager().lock().unwrap();

    if let Some(plugin) = manager.plugins.get(&plugin_id) {
        let health_info = json!({
            "plugin_id": plugin_id,
            "name": plugin.manifest.name,
            "version": plugin.manifest.version,
            "enabled": plugin.enabled,
            "loaded": plugin.loaded,
            "has_js_code": manager.js_runtime.plugin_codes.contains_key(&plugin_id),
            "manifest_path": plugin.path.join("manifest.json"),
            "main_file": plugin.path.join(&plugin.manifest.main),
            "frontend_file": plugin.manifest.frontend.as_ref().map(|f| plugin.path.join(f)),
            "permissions": plugin.manifest.permissions,
            "api_version": plugin.manifest.api_version,
            "timestamp": chrono::Utc::now().to_rfc3339()
        });
        Ok(health_info)
    } else {
        Err(format!("Plugin '{}' not found", plugin_id))
    }
}
