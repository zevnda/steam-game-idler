import type {
  ContextMenuItem,
  Plugin,
  PluginComponentProps,
  PluginPageComponent,
  PluginRegistry,
  SettingsTab,
  SidebarItem,
} from '@/types/plugin'

import { invoke } from '@tauri-apps/api/core'

import React from 'react'

class PluginRegistryManager {
  private registry: PluginRegistry = {
    pages: new Map(),
    settingsComponents: new Map(),
    sidebarItems: [],
    contextMenuItems: [],
    settingsTabs: [],
  }

  async loadPluginComponents(plugins: Plugin[]): Promise<void> {
    for (const plugin of plugins) {
      if (!plugin.enabled) continue

      try {
        // Load frontend component if specified
        if (plugin.manifest.frontend) {
          await this.loadPluginFrontend(plugin)
        }

        // Register sidebar items
        if (plugin.manifest.sidebar_items) {
          this.registerSidebarItems(plugin.manifest.sidebar_items, plugin.manifest.id)
        }

        // Register context menu items
        if (plugin.manifest.context_menus) {
          this.registerContextMenuItems(plugin.manifest.context_menus, plugin.manifest.id)
        }

        // Register settings tabs
        if (plugin.manifest.settings_tabs) {
          this.registerSettingsTabs(plugin.manifest.settings_tabs, plugin.manifest.id)
        }
      } catch (error) {
        console.error(`Failed to load plugin ${plugin.manifest.id}:`, error)
      }
    }
  }
  private async loadPluginFrontend(plugin: Plugin): Promise<void> {
    try {
      // Create a dynamic component that loads the plugin's frontend
      const PluginComponent: React.ComponentType<PluginComponentProps> = ({ config, onConfigChange }) => {
        const [pluginData, setPluginData] = React.useState(null)
        const [loading, setLoading] = React.useState(true)

        React.useEffect(() => {
          const loadPluginData = async () => {
            try {
              setLoading(true)
              const result = await invoke('execute_plugin_command', {
                pluginId: plugin.manifest.id,
                command: 'init',
                args: { config },
              })
              setPluginData(result)
            } catch (error) {
              console.error('Failed to load plugin data:', error)
            } finally {
              setLoading(false)
            }
          }

          loadPluginData()
        }, [config])

        if (loading) {
          return React.createElement(
            'div',
            {
              className: 'flex justify-center items-center p-8',
            },
            React.createElement('div', {
              className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-dynamic',
            }),
          )
        }

        return React.createElement(
          'div',
          { className: 'p-4' },
          [
            React.createElement('div', { className: 'mb-4', key: 'header' }, [
              React.createElement('h1', { className: 'text-2xl font-bold', key: 'title' }, plugin.manifest.name),
              React.createElement('p', { className: 'text-altwhite', key: 'desc' }, plugin.manifest.description),
            ]),

            pluginData &&
              React.createElement(
                'div',
                {
                  className: 'bg-titlebar border border-border rounded-lg p-4',
                  key: 'data',
                },
                [
                  React.createElement('h3', { className: 'font-semibold mb-2', key: 'data-title' }, 'Plugin Data:'),
                  React.createElement(
                    'pre',
                    {
                      className: 'text-sm bg-input p-2 rounded overflow-auto',
                      key: 'data-content',
                    },
                    JSON.stringify(pluginData, null, 2),
                  ),
                ],
              ),

            React.createElement(
              'div',
              {
                className: 'mt-4 p-4 bg-modalheader border border-border rounded-lg',
                key: 'info',
              },
              [
                React.createElement(
                  'h3',
                  { className: 'font-semibold mb-2', key: 'info-title' },
                  'Plugin Information:',
                ),
                React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm', key: 'info-grid' }, [
                  React.createElement('div', { key: 'version' }, [
                    React.createElement('span', { className: 'font-medium' }, 'Version: '),
                    plugin.manifest.version,
                  ]),
                  React.createElement('div', { key: 'author' }, [
                    React.createElement('span', { className: 'font-medium' }, 'Author: '),
                    plugin.manifest.author,
                  ]),
                  React.createElement('div', { key: 'api' }, [
                    React.createElement('span', { className: 'font-medium' }, 'API Version: '),
                    plugin.manifest.api_version,
                  ]),
                  React.createElement('div', { key: 'license' }, [
                    React.createElement('span', { className: 'font-medium' }, 'License: '),
                    plugin.manifest.license || 'N/A',
                  ]),
                ]),
              ],
            ),
          ].filter(Boolean),
        )
      }

      // Register the page component
      if (plugin.manifest.sidebar_items) {
        for (const sidebarItem of plugin.manifest.sidebar_items) {
          this.registry.pages.set(sidebarItem.page, {
            component: PluginComponent,
            plugin,
          })
        }
      }

      // Register settings component if it has settings tabs
      if (plugin.manifest.settings_tabs) {
        for (const settingsTab of plugin.manifest.settings_tabs) {
          this.registry.settingsComponents.set(settingsTab.id, PluginComponent)
        }
      }
    } catch (error) {
      console.error(`Failed to load frontend for plugin ${plugin.manifest.id}:`, error)
    }
  }

  private registerSidebarItems(items: SidebarItem[], pluginId: string): void {
    const pluginItems = items.map(item => ({
      ...item,
      id: `${pluginId}-${item.id}`,
      pluginId,
    }))
    this.registry.sidebarItems.push(...pluginItems)
    this.registry.sidebarItems.sort((a, b) => (a.order || 100) - (b.order || 100))
  }

  private registerContextMenuItems(items: ContextMenuItem[], pluginId: string): void {
    const pluginItems = items.map(item => ({
      ...item,
      id: `${pluginId}-${item.id}`,
      pluginId,
    }))
    this.registry.contextMenuItems.push(...pluginItems)
  }

  private registerSettingsTabs(tabs: SettingsTab[], pluginId: string): void {
    const pluginTabs = tabs.map(tab => ({
      ...tab,
      id: `${pluginId}-${tab.id}`,
      pluginId,
    }))
    this.registry.settingsTabs.push(...pluginTabs)
    this.registry.settingsTabs.sort((a, b) => (a.order || 100) - (b.order || 100))
  }

  getPageComponent(page: string): PluginPageComponent | undefined {
    return this.registry.pages.get(page)
  }

  getSettingsComponent(componentId: string): React.ComponentType<PluginComponentProps> | undefined {
    return this.registry.settingsComponents.get(componentId)
  }

  getSidebarItems(): SidebarItem[] {
    return this.registry.sidebarItems
  }

  getContextMenuItems(context: string): ContextMenuItem[] {
    return this.registry.contextMenuItems.filter(item => item.contexts.includes(context))
  }

  getSettingsTabs(): SettingsTab[] {
    return this.registry.settingsTabs
  }

  clearRegistry(): void {
    this.registry.pages.clear()
    this.registry.settingsComponents.clear()
    this.registry.sidebarItems = []
    this.registry.contextMenuItems = []
    this.registry.settingsTabs = []
  }

  async refreshRegistry(plugins: Plugin[]): Promise<void> {
    this.clearRegistry()
    await this.loadPluginComponents(plugins)
  }
}

export const pluginRegistry = new PluginRegistryManager()
