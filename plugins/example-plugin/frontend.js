// Frontend Component for Example Plugin
function ExamplePluginPage({ plugin, config, onConfigChange }) {
  return `
    <div style="padding: 16px;">
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 16px;">
        ${plugin.manifest.name}
      </h1>
      <p style="color: #888; margin-bottom: 16px;">
        ${plugin.manifest.description}
      </p>
      
      <div style="background: #2a2a2a; border: 1px solid #444; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-weight: 600; margin-bottom: 8px;">Plugin Information:</h3>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 14px;">
          <div>
            <span style="font-weight: 500;">Version:</span> ${plugin.manifest.version}
          </div>
          <div>
            <span style="font-weight: 500;">Author:</span> ${plugin.manifest.author}
          </div>
          <div>
            <span style="font-weight: 500;">API Version:</span> ${plugin.manifest.api_version}
          </div>
          <div>
            <span style="font-weight: 500;">License:</span> ${plugin.manifest.license}
          </div>
        </div>
      </div>

      <div style="background: #1a3a1a; border: 1px solid #2a5a2a; border-radius: 8px; padding: 16px;">
        <h3 style="font-weight: 600; margin-bottom: 8px; color: #4ade80;">Features Demonstrated:</h3>
        <ul style="list-style-type: disc; margin-left: 20px; font-size: 14px; line-height: 1.6;">
          <li>Custom sidebar item with badge</li>
          <li>Plugin page rendering</li>
          <li>Context menu integration (check game cards)</li>
          <li>Settings tab integration</li>
          <li>JavaScript execution in QuickJS runtime</li>
        </ul>
      </div>
    </div>
  `
}

function ExamplePluginSettings({ plugin, config, onConfigChange }) {
  return `
    <div style="padding: 16px;">
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">
        ${plugin.manifest.name} Settings
      </h3>
      
      <div style="background: #2a2a2a; border: 1px solid #444; border-radius: 8px; padding: 16px;">
        <h4 style="font-weight: 500; margin-bottom: 12px;">Configuration Options:</h4>
        <div style="font-size: 14px; color: #888;">
          <p>This is where plugin-specific settings would go.</p>
          <p>Settings can be managed through the plugin API and persisted automatically.</p>
        </div>
      </div>
    </div>
  `
}

// Export components for the plugin system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ExamplePluginPage,
    ExamplePluginSettings,
  }
}
