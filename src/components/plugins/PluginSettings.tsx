import type { ReactElement } from 'react'

import { usePluginContext } from '@/components/contexts/PluginContext'
import { pluginRegistry } from '@/utils/plugin-registry'

interface PluginSettingsProps {
  pluginId: string
}

export default function PluginSettings({ pluginId }: PluginSettingsProps): ReactElement {
  const { plugins } = usePluginContext()

  const plugin = plugins.find(p => p.manifest.id === pluginId)

  if (!plugin) {
    return (
      <div className='p-4'>
        <h3 className='text-lg font-semibold mb-4'>Plugin Not Found</h3>
        <p className='text-sm text-dynamic'>The plugin "{pluginId}" could not be found.</p>
      </div>
    )
  }

  // Look for settings component registered by this plugin
  const settingsTabs = pluginRegistry.getSettingsTabs()
  const pluginSettingsTab = settingsTabs.find(tab => tab.pluginId === pluginId)

  if (pluginSettingsTab) {
    const PluginSettingsComponent = pluginRegistry.getSettingsComponent(pluginSettingsTab.id)
    if (PluginSettingsComponent) {
      return <PluginSettingsComponent plugin={plugin} />
    }
  }

  // Default settings view if plugin doesn't provide custom settings
  return (
    <div className='p-4'>
      <h3 className='text-lg font-semibold mb-4'>{plugin.manifest.name} Settings</h3>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-2'>Plugin ID</label>
          <p className='text-sm text-dynamic'>{plugin.manifest.id}</p>
        </div>
        <div>
          <label className='block text-sm font-medium mb-2'>Version</label>
          <p className='text-sm text-dynamic'>{plugin.manifest.version}</p>
        </div>
        <div>
          <label className='block text-sm font-medium mb-2'>Description</label>
          <p className='text-sm text-dynamic'>{plugin.manifest.description}</p>
        </div>
        <div>
          <label className='block text-sm font-medium mb-2'>Author</label>
          <p className='text-sm text-dynamic'>{plugin.manifest.author}</p>
        </div>
        {plugin.manifest.entryPoints?.settings && (
          <div>
            <p className='text-sm text-dynamic'>
              This plugin provides custom settings. The settings component should be registered properly.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
