# Plugin Development Guide

This guide will help you create plugins for Steam Game Idler. The plugin system supports both backend functionality (via JavaScript executed in the Rust runtime) and frontend UI components (via React).

## Plugin Structure

Every plugin must have the following structure:

```
plugins/
  your-plugin-id/
    manifest.json     # Plugin metadata and configuration
    plugin.js         # Backend JavaScript code (optional)
    frontend.tsx      # Frontend React components (optional)
    README.md         # Plugin documentation
    assets/           # Plugin assets (icons, images, etc.)
```

## Manifest File

The `manifest.json` file defines your plugin's metadata and capabilities:

```json
{
  "id": "your-plugin-id",
  "name": "Your Plugin Name",
  "version": "1.0.0",
  "description": "A brief description of your plugin",
  "author": "Your Name",
  "main": "plugin.js",
  "frontend": "frontend.tsx",
  "permissions": ["steamapi", "filesystem", "network"],
  "api_version": "1.0",
  "dependencies": {
    "some-library": "^1.0.0"
  },
  "sidebar_items": [
    {
      "id": "your-sidebar-item",
      "title": "Your Plugin",
      "icon": "plugin",
      "page": "your-plugin-page",
      "tooltip": "Access your plugin features",
    }
  ],
  "context_menus": [
    {
      "id": "your-context-menu",
      "title": "Your Action",
      "icon": "action",
      "contexts": ["game-card"]
    }
  ],
  "settings_tabs": [
    {
      "id": "your-settings",
      "title": "Your Plugin Settings",
      "icon": "settings",
      "component": "YourSettings",
    }
  ]
}
```

### Manifest Fields

- **Required Fields:**
  - `id`: Unique identifier for your plugin
  - `name`: Display name
  - `version`: Semantic version
  - `description`: Brief description
  - `author`: Plugin author
  - `api_version`: Supported API version

- **Optional Fields:**
  - `main`: Backend JavaScript file
  - `frontend`: Frontend React components file
  - `permissions`: Array of required permissions
  - `dependencies`: NPM-style dependencies
  - `sidebar_items`: Sidebar navigation items
  - `context_menus`: Context menu items
  - `settings_tabs`: Settings page tabs

## Backend Development (plugin.js)

The backend JavaScript code runs in a Rust runtime and handles plugin logic:

```javascript
// Plugin initialization
function init(args) {
  return {
    status: "success",
    message: "Plugin initialized",
    steamStatus: "running",
    gameCount: 150,
    lastAction: "initialized",
    timestamp: new Date().toISOString()
  };
}

// Get game data from Steam
function get_game_data(args) {
  // Mock data - replace with actual Steam API calls
  return {
    status: "success",
    games: [
      {
        appid: 730,
        name: "Counter-Strike 2",
        playtime_forever: 12000
      }
    ],
    totalGames: 1,
    totalPlaytime: 12000,
    timestamp: new Date().toISOString()
  };
}

// Handle context menu actions
function context_menu_action(args) {
  const { menuItemId, context, game } = args;
  
  return {
    status: "success",
    message: `Action performed on ${game.name}`,
    timestamp: new Date().toISOString()
  };
}

// Export functions for the runtime
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    get_game_data,
    context_menu_action
  };
}
```

### Available Commands

Your plugin can implement these command handlers:

- `init(args)`: Plugin initialization
- `enable(args)`: Plugin enabled
- `disable(args)`: Plugin disabled
- `get_game_data(args)`: Fetch game data
- `get_steam_status(args)`: Check Steam status
- `context_menu_action(args)`: Handle context menu clicks

## Frontend Development (frontend.tsx)

The frontend components are React components that integrate with the app:

```tsx
import { invoke } from '@tauri-apps/api/core'
import React, { useEffect, useState } from 'react'

export const YourPluginPage: React.FC = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await invoke('execute_plugin_command', {
        pluginId: 'your-plugin-id',
        command: 'init',
        args: {},
      })
      setData(result)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <h1 className='text-3xl font-bold mb-2 text-content'>Your Plugin</h1>
      
      {/* Use app design system classes */}
      <div className='bg-titlebar border border-border rounded-lg p-4'>
        <h2 className='text-xl font-semibold mb-4 text-content'>Plugin Content</h2>
        {loading ? (
          <div className='text-dynamic'>Loading...</div>
        ) : (
          <div className='text-content'>
            {/* Your plugin UI here */}
          </div>
        )}
      </div>
    </div>
  )
}

export const YourSettings: React.FC = () => {
  return (
    <div className='p-6'>
      <h2 className='text-2xl font-semibold mb-6 text-content'>Plugin Settings</h2>
      {/* Your settings UI here */}
    </div>
  )
}
```

### Design System Classes

Use these CSS classes to match the app's theme:

**Colors:**
- `text-content`: Primary text color
- `text-dynamic`: Secondary text color
- `bg-titlebar`: Background color for cards/panels
- `bg-input`: Input field background
- `border-border`: Border color

**Components:**
- `bg-primary text-primarycontent`: Primary buttons
- `bg-success text-successcontent`: Success states
- `bg-warning text-warningcontent`: Warning states
- `bg-danger text-dangercontent`: Error states

### Tauri Commands

Use these commands to interact with the backend:

```tsx
// Execute plugin command
const result = await invoke('execute_plugin_command', {
  pluginId: 'your-plugin-id',
  command: 'your_command',
  args: { /* command arguments */ }
})

// Get plugin configuration
const config = await invoke('get_plugin_config', {
  pluginId: 'your-plugin-id'
})

// Save plugin configuration
await invoke('save_plugin_config', {
  pluginId: 'your-plugin-id',
  config: { /* your config object */ }
})

// Get all installed plugins
const plugins = await invoke('get_installed_plugins')

// Enable/disable plugin
await invoke('toggle_plugin', {
  pluginId: 'your-plugin-id',
  enabled: true
})
```

## Permissions

Request permissions in your manifest to access app features:

- `steamapi`: Access to Steam API data
- `filesystem`: File system read/write access
- `network`: Network/HTTP requests
- `notifications`: Show notifications to user
- `storage`: Persistent data storage

## Plugin Context

Your frontend components have access to the plugin context:

```tsx
import { usePluginContext } from '@/components/contexts/PluginContext'

const { plugins, togglePlugin, refreshPlugins } = usePluginContext()
```

## Testing Your Plugin

1. Place your plugin folder in the `plugins/` directory
2. Restart the application or refresh plugins
3. Your plugin should appear in the sidebar and settings
4. Test all functionality thoroughly

## Best Practices

1. **Error Handling**: Always handle errors gracefully
2. **Loading States**: Show loading indicators for async operations
3. **Responsive Design**: Ensure your UI works on different screen sizes
4. **Theme Consistency**: Use the app's design system classes
5. **Performance**: Avoid blocking operations in the main thread
6. **Documentation**: Include clear documentation and examples

## Publishing

To share your plugin:

1. Create a GitHub repository for your plugin
2. Include installation instructions
3. Document all features and configuration options
4. Consider submitting to the plugin registry

## Example Plugins

See the `example-plugin` folder for a complete working example that demonstrates:

- Backend command handling
- Frontend UI components
- Configuration management
- Context menu integration
- Settings page integration
- Proper styling and theming

## Troubleshooting

**Plugin not loading:**
- Check manifest.json syntax
- Verify plugin ID is unique
- Check file permissions

**Commands not working:**
- Ensure function names match command names
- Check function return values
- Verify plugin is enabled

**UI not displaying:**
- Check component export names
- Verify frontend file path in manifest
- Check for JavaScript errors in console

## API Reference

For detailed API documentation, see:
- `src/types/plugin.ts` - TypeScript type definitions
- `src-tauri/src/plugins.rs` - Backend plugin manager
- `src/components/contexts/PluginContext.tsx` - Frontend context

## Support

For help developing plugins:
- Check existing plugins for examples
- Review the source code
- Submit issues for bugs or feature requests
