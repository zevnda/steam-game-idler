# Plugin Development Guide

This guide explains how to create plugins for Steam Game Idler.

## Plugin Structure

A plugin is a directory containing at least:
- `manifest.json` - Plugin metadata and configuration
- `plugin.js` - Main plugin logic (backend)
- `frontend.js` - Frontend components (optional)

## Manifest File

The `manifest.json` file defines the plugin metadata:

```json
{
  "name": "Plugin Name",
  "id": "unique-plugin-id",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": "Your Name",
  "api_version": "1.0",
  "license": "MIT",
  "entry_points": {
    "main": "plugin.js",
    "frontend": "frontend.js"
  },
  "dependencies": [],
  "permissions": ["steamapi", "filesystem"],
  "sidebar_items": [...],
  "context_menus": [...],
  "settings_tabs": [...]
}
```

### Sidebar Items

Add custom buttons to the sidebar:

```json
"sidebar_items": [
  {
    "id": "my-page",
    "title": "My Plugin",
    "icon": "TbStar",
    "page": "plugins/my-plugin",
    "order": 50,
    "badge": {
      "text": "NEW",
      "color": "#00ff00"
    }
  }
]
```

### Context Menus

Add items to context menus:

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

Available contexts:
- `game-card` - Right-click menu on game cards

### Settings Tabs

Add custom settings tabs:

```json
"settings_tabs": [
  {
    "id": "my-settings",
    "title": "My Settings",
    "icon": "TbSettings",
    "component": "settings.js",
    "order": 100
  }
]
```

## Plugin JavaScript (Backend)

The main plugin file handles backend logic:

```javascript
// Lifecycle hooks
function init(context) {
  // Initialize plugin
  return { status: 'success', message: 'Initialized' };
}

function enable(context) {
  // Enable plugin
  return { status: 'success', message: 'Enabled' };
}

function disable(context) {
  // Disable plugin
  return { status: 'success', message: 'Disabled' };
}

// Context menu handler
function context_menu_action(args) {
  const { menuItemId, context, game } = args;
  // Handle context menu actions
  return { status: 'success', message: 'Action completed' };
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    enable,
    disable,
    context_menu_action
  };
}
```

## Frontend Components (Optional)

Frontend components render in the UI:

```javascript
function MyPluginPage({ plugin, config, onConfigChange }) {
  return `<div>HTML content for plugin page</div>`;
}

function MyPluginSettings({ plugin, config, onConfigChange }) {
  return `<div>HTML content for settings</div>`;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MyPluginPage,
    MyPluginSettings
  };
}
```

## Available APIs

Plugins can access:
- Steam API data
- File system operations (with permissions)
- Plugin configuration storage
- Inter-plugin communication

## Installation

1. Place plugin directory in the `plugins/` folder
2. Open Settings > Plugins
3. Click "Install Plugin" and select your plugin directory
4. Enable the plugin

## Example Plugin

See the `example-plugin` directory for a complete working example that demonstrates all features.
