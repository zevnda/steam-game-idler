# Plugin Development Guide

This guide explains how to create plugins for Steam Game Idler. Our comprehensive plugin system allows you to extend the application with custom functionality, UI components, and integrations.

## 🚀 Plugin System Features

- **Backend JavaScript Runtime**: Execute JavaScript code in a secure QuickJS environment
- **Frontend React Components**: Create rich UI components with full access to the app's design system
- **Configuration Management**: Persistent plugin settings with automatic serialization
- **Steam API Integration**: Access Steam data and game information
- **Event Hooks**: Respond to game events (start/stop, achievements, etc.)
- **Context Menus**: Add custom actions to game cards and other UI elements
- **Sidebar Integration**: Add custom navigation items with badges and icons
- **Settings Tabs**: Create dedicated settings pages for your plugins
- **Hot Reloading**: Install, enable, and disable plugins without restarting the app

## 📁 Plugin Structure

A plugin is a directory containing at least:
```
my-plugin/
├── manifest.json    # Plugin metadata and configuration
├── plugin.js        # Main plugin logic (backend)
├── frontend.tsx     # React components (optional)
└── README.md        # Documentation (optional)
```

## 📋 Manifest File

The `manifest.json` file defines the plugin metadata:

```json
{
  "name": "My Plugin",
  "id": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Your Name",
  "api_version": "1.0",
  "license": "MIT",
  "main": "plugin.js",
  "frontend": "frontend.tsx",
  "permissions": ["steamapi", "filesystem", "config"],
  "dependencies": null,
  "sidebar_items": [...],
  "context_menus": [...],
  "settings_tabs": [...],
  "entry_points": {...}
}
```

### Required Fields
- `id`: Unique plugin identifier (kebab-case)
- `name`: Display name
- `version`: Semantic version (e.g., "1.0.0")
- `description`: Brief description of functionality
- `author`: Plugin author name
- `api_version`: Plugin API version ("1.0")

### Optional Fields
- `license`: Software license
- `homepage`: Plugin homepage URL
- `repository`: Source code repository URL
- `icon`: Default icon (Tabler icon name)
- `main`: Backend script filename
- `frontend`: Frontend component filename
- `permissions`: Array of required permissions
- `dependencies`: Plugin dependencies (future feature)

## 🎯 Sidebar Items

Add custom buttons to the application sidebar:

```json
"sidebar_items": [
  {
    "id": "my-page",
    "title": "My Plugin",
    "icon": "TbStar",
    "page": "plugins/my-plugin",
    "tooltip": "Open my plugin page",
  }
]
```

**Properties:**
- `id`: Unique identifier
- `title`: Display text
- `icon`: Tabler icon name (e.g., "TbStar", "TbSettings")
- `page`: Route path (must start with "plugins/")
- `tooltip`: Hover tooltip text

## 📱 Context Menus

Add items to context menus throughout the app:

```json
"context_menus": [
  {
    "id": "my-action",
    "title": "My Action",
    "icon": "TbStar",
    "contexts": ["game-card"]
  }
]
```

**Available Contexts:**
- `game-card`: Right-click menu on game cards
- `achievement`: Achievement context menus (future)
- `settings`: Settings context menus (future)

## ⚙️ Settings Tabs

Create dedicated settings pages:

```json
"settings_tabs": [
  {
    "id": "my-settings",
    "title": "My Settings",
    "icon": "TbSettings",
    "component": "MySettings",
  }
]
```

## 🔧 Entry Points & Hooks

Define lifecycle hooks and event handlers:

```json
"entry_points": {
  "onLoad": "onLoad",
  "onUnload": "onUnload", 
  "onGameStartup": "onGameStart",
  "onGameStop": "onGameStop",
  "onAchievementUnlock": "onAchievementUnlock"
}
```

## 💻 Backend JavaScript

The main plugin file handles backend logic with access to a QuickJS runtime:

```javascript
// Plugin state (persists during session)
let pluginState = {
  initialized: false,
  actionCount: 0
}

// Lifecycle hooks
function init(context) {
  pluginState.initialized = true
  return {
    status: 'success',
    message: 'Plugin initialized',
    data: { gameCount: 150, steamStatus: 'running' }
  }
}

function enable(context) {
  return { status: 'success', message: 'Plugin enabled' }
}

function disable(context) {
  return { status: 'success', message: 'Plugin disabled' }
}

// Custom commands
function get_game_data(args) {
  return {
    status: 'success',
    games: [
      { appid: 730, name: "Counter-Strike 2", playtime_forever: 12400 }
    ]
  }
}

// Context menu handler
function context_menu_action(args) {
  const { menuItemId, context, game } = args
  
  if (menuItemId === 'my-action') {
    return {
      status: 'success',
      message: `Action executed for ${game.name}`
    }
  }
  
  return { status: 'error', message: 'Unknown action' }
}

// Event hooks
function onGameStartup(args) {
  const { game } = args
  console.log('Game started:', game.name)
  return { status: 'success' }
}

// Export all functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    enable, 
    disable,
    get_game_data,
    context_menu_action,
    onGameStartup
  }
}
```

## 🎨 Frontend Components

Create React components using the app's design system:

```tsx
import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

export const MyPluginPage: React.FC = () => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await invoke('execute_plugin_command', {
        pluginId: 'my-plugin',
        command: 'get_game_data',
        args: {}
      })
      setData(result)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">My Plugin</h1>
      
      <button 
        onClick={loadData}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Load Data'}
      </button>

      {data && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export const MySettings: React.FC = () => {
  const [config, setConfig] = useState<any>({})

  const saveConfig = async () => {
    await invoke('save_plugin_config', {
      pluginId: 'my-plugin',
      config: config
    })
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Plugin Settings</h2>
      {/* Settings UI here */}
      <button onClick={saveConfig}>Save Settings</button>
    </div>
  )
}
```

## 🔑 Available APIs

### Plugin Management
```javascript
// Get plugin configuration
await invoke('get_plugin_config', { pluginId: 'my-plugin' })

// Save plugin configuration  
await invoke('save_plugin_config', { pluginId: 'my-plugin', config: {...} })

// Execute plugin command
await invoke('execute_plugin_command', { 
  pluginId: 'my-plugin', 
  command: 'my_command', 
  args: {...} 
})
```

### Steam Integration
- Access to user's Steam library
- Game information and metadata
- Achievement data
- Playtime statistics
- Steam process status

### File System (with permissions)
- Read/write plugin configuration
- Access plugin directory
- Cache data storage

## 🛠️ Development Workflow

1. **Create Plugin Directory**
   ```bash
   mkdir plugins/my-plugin
   cd plugins/my-plugin
   ```

2. **Create Manifest**
   ```bash
   touch manifest.json
   # Add plugin metadata
   ```

3. **Implement Backend**
   ```bash
   touch plugin.js
   # Add JavaScript logic
   ```

4. **Create Frontend (Optional)**
   ```bash
   touch frontend.tsx
   # Add React components
   ```

5. **Install Plugin**
   - Open Steam Game Idler
   - Go to Settings > Plugins
   - Click "Install Plugin"
   - Select your plugin directory

6. **Test & Debug**
   - Enable the plugin
   - Check console for errors
   - Test functionality

## 📦 Installation

### From Directory
1. Place plugin directory in `%APPDATA%/Steam Game Idler/plugins/` 
2. Open Settings > Plugins
3. Click "Install Plugin" and select directory
4. Enable the plugin

### Distribution
- Package as ZIP file
- Share plugin directory
- Include installation instructions
- Consider publishing to a plugin registry (future)

## 🎯 Example Plugin

See the `example-plugin` directory for a complete working example demonstrating:

- ✅ Plugin lifecycle management
- ✅ Steam API integration simulation
- ✅ Game data visualization
- ✅ Configuration persistence
- ✅ Context menu actions
- ✅ Custom UI components
- ✅ Settings management
- ✅ Event handling
- ✅ Background tasks

## 🚀 Best Practices

1. **Error Handling**: Always wrap async operations in try-catch
2. **Performance**: Avoid blocking operations in UI components
3. **Configuration**: Use persistent config for user preferences
4. **Permissions**: Request minimal required permissions
5. **Compatibility**: Test with different app versions
6. **Documentation**: Include clear README and code comments
7. **Versioning**: Use semantic versioning for releases

## 🔍 Debugging

- Check browser developer tools for frontend errors
- View plugin console logs in the backend
- Use the plugin manager to enable/disable for testing
- Test configuration persistence across app restarts

## 🤝 Contributing

- Submit example plugins to help other developers
- Report bugs and suggest improvements
- Contribute to the plugin system core functionality
- Share your plugins with the community

---

**Need Help?** Check the example plugin or open an issue on GitHub!
