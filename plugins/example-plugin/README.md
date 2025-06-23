# Example Plugin

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
