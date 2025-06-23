use chrono;
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
    pub context_menus: Option<Vec<ContextMenuItem>>,
    pub settings_tabs: Option<Vec<SettingsTab>>,
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
    pub order: Option<i32>,
    pub badge: Option<String>,
    pub badge_color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextMenuItem {
    pub id: String,
    pub title: String,
    pub icon: String,
    pub contexts: Vec<String>, // ["game-card", "achievement", "settings"]
    pub separator: Option<bool>,
    pub submenu: Option<Vec<ContextMenuItem>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingsTab {
    pub id: String,
    pub title: String,
    pub icon: String,
    pub component: String,
    pub order: Option<i32>,
}

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
    // Simple runtime for now - can be replaced with a proper JS engine later
}

impl JSRuntime {
    pub fn new() -> Result<Self, String> {
        Ok(Self {})
    }

    pub fn execute_plugin(
        &self,
        _plugin_code: &str,
        command: &str,
        args: Value,
        _app_handle: &AppHandle,
    ) -> Result<Value, String> {
        // For now, return a mock response indicating the command was received
        // In a real implementation, this would execute the JavaScript code
        Ok(json!({
            "command": command,
            "args": args,
            "result": "Plugin execution simulated (JavaScript runtime not yet implemented)",
            "timestamp": chrono::Utc::now().to_rfc3339(),
            "success": true
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

        // Validate required files exist
        let main_file = plugin_dir.join(&manifest.main);
        if !main_file.exists() {
            return Err(format!("Main file {} not found", manifest.main));
        }
        let plugin = Plugin {
            manifest,
            enabled: true, // Default to enabled, load from config later
            loaded: false,
            path: plugin_dir.to_path_buf(),
            config: None,
        };

        self.plugins.insert(plugin.manifest.id.clone(), plugin);
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
        items.sort_by_key(|item| item.order.unwrap_or(100));
        items
    }

    pub fn get_context_menu_items(&self, context: &str) -> Vec<ContextMenuItem> {
        let mut items = Vec::new();
        for plugin in self.get_enabled_plugins() {
            if let Some(context_menus) = &plugin.manifest.context_menus {
                for menu_item in context_menus {
                    if menu_item.contexts.contains(&context.to_string()) {
                        items.push(menu_item.clone());
                    }
                }
            }
        }
        items
    }
    pub fn get_settings_tabs(&self) -> Vec<SettingsTab> {
        let mut tabs = Vec::new();
        for plugin in self.get_enabled_plugins() {
            if let Some(settings_tabs) = &plugin.manifest.settings_tabs {
                tabs.extend(settings_tabs.clone());
            }
        }
        tabs.sort_by_key(|tab| tab.order.unwrap_or(100));
        tabs
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

    pub fn install_plugin_from_zip(&mut self, zip_path: &Path) -> Result<String, String> {
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
pub async fn get_plugin_context_menu_items(context: String) -> Result<Value, String> {
    let manager = get_plugin_manager().lock().unwrap();
    let items = manager.get_context_menu_items(&context);
    Ok(json!(items))
}

#[tauri::command]
pub async fn get_plugin_settings_tabs() -> Result<Value, String> {
    let manager = get_plugin_manager().lock().unwrap();
    let tabs = manager.get_settings_tabs();
    Ok(json!(tabs))
}

#[tauri::command]
pub async fn execute_plugin_command(
    plugin_id: String,
    command: String,
    args: Value,
    app_handle: AppHandle,
) -> Result<Value, String> {
    let manager = get_plugin_manager().lock().unwrap();

    if let Some(plugin) = manager.plugins.get(&plugin_id) {
        if !plugin.enabled {
            return Err("Plugin is disabled".to_string());
        }

        // Load and execute plugin JavaScript/TypeScript
        let main_file = plugin.path.join(&plugin.manifest.main);
        let plugin_code = fs::read_to_string(&main_file)
            .map_err(|e| format!("Failed to read plugin main file: {}", e))?;

        // Execute using QuickJS runtime
        match manager
            .js_runtime
            .execute_plugin(&plugin_code, &command, args.clone(), &app_handle)
        {
            Ok(result) => Ok(result),
            Err(e) => {
                // Fallback to simple response for compatibility
                Ok(json!({
                    "plugin_id": plugin_id,
                    "command": command,
                    "args": args,
                    "error": e,
                    "result": "Plugin execution failed"
                }))
            }
        }
    } else {
        Err(format!("Plugin {} not found", plugin_id))
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
pub async fn create_example_plugin(app_handle: AppHandle) -> Result<Value, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let plugins_dir = app_data_dir.join("plugins");
    let example_dir = plugins_dir.join("example-plugin");

    fs::create_dir_all(&example_dir)
        .map_err(|e| format!("Failed to create example plugin directory: {}", e))?; // Create manifest.json
    let manifest = PluginManifest {
        id: "example-plugin".to_string(),
        name: "Example Plugin".to_string(),
        version: "1.0.0".to_string(),
        description: "An example plugin demonstrating plugin capabilities".to_string(),
        author: "Steam Game Idler".to_string(),
        main: "index.js".to_string(),
        frontend: Some("frontend.tsx".to_string()),
        permissions: vec!["api".to_string(), "fs".to_string()],
        api_version: "1.0".to_string(),
        dependencies: None,
        sidebar_items: Some(vec![SidebarItem {
            id: "example-plugin-page".to_string(),
            title: "Example Plugin".to_string(),
            icon: "TbPlug".to_string(),
            page: "plugins/example-plugin".to_string(),
            tooltip: "Example Plugin Page".to_string(),
            order: Some(50),
            badge: None,
            badge_color: None,
        }]),
        context_menus: Some(vec![ContextMenuItem {
            id: "example-context-menu".to_string(),
            title: "Example Action".to_string(),
            icon: "TbStar".to_string(),
            contexts: vec!["game-card".to_string()],
            separator: None,
            submenu: None,
        }]),
        settings_tabs: Some(vec![SettingsTab {
            id: "example-settings".to_string(),
            title: "Example Plugin".to_string(),
            icon: "TbPlug".to_string(),
            component: "ExampleSettings".to_string(),
            order: Some(10),
        }]),
        entry_points: Some(PluginEntryPoints {
            on_load: Some("onLoad".to_string()),
            on_unload: Some("onUnload".to_string()),
            on_game_start: Some("onGameStart".to_string()),
            on_game_stop: Some("onGameStop".to_string()),
            on_achievement_unlock: Some("onAchievementUnlock".to_string()),
        }),
        icon: Some("TbPlug".to_string()),
        homepage: Some("https://github.com/zevnda/steam-game-idler".to_string()),
        repository: Some("https://github.com/zevnda/steam-game-idler".to_string()),
        license: Some("GPL-3.0".to_string()),
    };

    let manifest_json = serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("Failed to serialize manifest: {}", e))?;

    fs::write(example_dir.join("manifest.json"), manifest_json)
        .map_err(|e| format!("Failed to write manifest.json: {}", e))?;

    // Create index.js
    let main_js = r#"
// Example Plugin Main File
class ExamplePlugin {
    constructor() {
        this.name = "Example Plugin";
        this.version = "1.0.0";
    }

    async init() {
        console.log("Example Plugin initialized");
        return { success: true, message: "Plugin loaded successfully" };
    }

    async handleCommand(command, args) {
        switch (command) {
            case "hello":
                return { message: `Hello from ${this.name}!`, args };
            case "get_data":
                return await this.getData();
            default:
                return { error: `Unknown command: ${command}` };
        }
    }

    async getData() {
        // Example of accessing app APIs
        try {
            const games = await window.__TAURI__.invoke('get_games_list');
            return { games: games.slice(0, 5) }; // Return first 5 games
        } catch (error) {
            return { error: error.toString() };
        }
    }

    onGameCardContextMenu(game) {
        return {
            action: "show_notification",
            message: `Example action for ${game.name}`
        };
    }
}

// Export the plugin
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExamplePlugin;
} else {
    window.ExamplePlugin = ExamplePlugin;
}
"#;

    fs::write(example_dir.join("index.js"), main_js)
        .map_err(|e| format!("Failed to write index.js: {}", e))?;

    // Create frontend.tsx
    let frontend_tsx = r#"
import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export const ExamplePluginPage: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleGetData = async () => {
        setLoading(true);
        try {
            const result = await invoke('execute_plugin_command', {
                pluginId: 'example-plugin',
                command: 'get_data',
                args: {}
            });
            setData(result);
        } catch (error) {
            console.error('Failed to get plugin data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Example Plugin</h1>
            <p className="mb-4">This is an example plugin page demonstrating plugin capabilities.</p>
            
            <button 
                onClick={handleGetData}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
                {loading ? 'Loading...' : 'Get Data from Plugin'}
            </button>

            {data && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                    <h3 className="font-semibold">Plugin Data:</h3>
                    <pre className="mt-2 text-sm">{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export const ExampleSettings: React.FC = () => {
    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Example Plugin Settings</h2>
            <p>Plugin-specific settings would go here.</p>
        </div>
    );
};
"#;

    fs::write(example_dir.join("frontend.tsx"), frontend_tsx)
        .map_err(|e| format!("Failed to write frontend.tsx: {}", e))?;

    // Create README.md
    let readme = r#"# Example Plugin

This is an example plugin for Steam Game Idler demonstrating the plugin system capabilities.

## Features

- Custom sidebar item
- Context menu integration
- Settings tab
- Backend API access
- Custom frontend components

## Files

- `manifest.json` - Plugin configuration and metadata
- `index.js` - Main plugin logic
- `frontend.tsx` - React components for UI
- `README.md` - This file

## Development

To create your own plugin:

1. Copy this example plugin directory
2. Modify the `manifest.json` with your plugin details
3. Implement your plugin logic in `index.js`
4. Create custom React components in `frontend.tsx`
5. Update the README with your plugin documentation

## API Access

Plugins can access the main app's Tauri commands through `window.__TAURI__.invoke()`.
"#;

    fs::write(example_dir.join("README.md"), readme)
        .map_err(|e| format!("Failed to write README.md: {}", e))?;

    Ok(json!({
        "success": true,
        "message": "Example plugin created successfully",
        "path": example_dir.to_string_lossy()
    }))
}
