import type { SidebarItem } from '@/types'
import type { ActivePageType } from '@/types/navigation'
import type { Plugin, PluginComponentProps, PluginPageComponent, PluginRegistry } from '@/types/plugin'

import { invoke } from '@tauri-apps/api/core'

import React from 'react'

interface PluginInitResult {
  data?: unknown
  status?: string
  [key: string]: unknown
}

interface PluginSidebarItemRaw {
  id: string
  page: string
  icon: string
  tooltip: string
  shouldShow?: boolean
  isActive?: boolean
  customClassName?: string
}

class PluginRegistryManager {
  private registry: PluginRegistry = {
    pages: new Map(),
    settingsComponents: new Map(),
    sidebarItems: [],
  }

  async loadPluginComponents(plugins: Plugin[]): Promise<void> {
    for (const plugin of plugins) {
      if (!plugin.enabled) continue

      try {
        // Load frontend component if specified
        if (plugin.manifest.frontend) {
          await this.loadPluginFrontend(plugin)
        } // Register sidebar items (handle both camelCase and snake_case)
        const manifestSidebarItems = plugin.manifest.sidebarItems
        const legacySidebarItems = (plugin.manifest as unknown as Record<string, unknown>).sidebar_items as
          | PluginSidebarItemRaw[]
          | undefined

        if (manifestSidebarItems) {
          this.registerSidebarItemsFromManifest(manifestSidebarItems, plugin.manifest.id)
        } else if (legacySidebarItems) {
          this.registerSidebarItems(legacySidebarItems, plugin.manifest.id)
        }
      } catch (error) {
        console.error(`Failed to load plugin ${plugin.manifest.id}:`, error)
      }
    }
  }
  private async loadPluginFrontend(plugin: Plugin): Promise<void> {
    try {
      // For the example plugin, we need to dynamically import the actual frontend component
      if (plugin.manifest.id === 'example-plugin') {
        // Import the actual ExamplePluginPage component
        const { ExamplePluginPage } = await import('../../plugins/example-plugin/frontend') // Register the actual plugin component
        const manifestSidebarItems = plugin.manifest.sidebarItems
        const legacySidebarItems = (plugin.manifest as unknown as Record<string, unknown>).sidebar_items as
          | PluginSidebarItemRaw[]
          | undefined

        if (manifestSidebarItems) {
          for (const sidebarItem of manifestSidebarItems) {
            this.registry.pages.set(sidebarItem.page, {
              component: ExamplePluginPage as React.ComponentType<PluginComponentProps>,
              plugin,
            })
          }
        } else if (legacySidebarItems) {
          for (const sidebarItem of legacySidebarItems) {
            this.registry.pages.set(sidebarItem.page as ActivePageType, {
              component: ExamplePluginPage as React.ComponentType<PluginComponentProps>,
              plugin,
            })
          }
        }
      } else {
        // For other plugins, create a generic fallback component
        const PluginComponent: React.ComponentType<PluginComponentProps> = ({ config }) => {
          const [pluginData, setPluginData] = React.useState<PluginInitResult | null>(null)
          const [loading, setLoading] = React.useState(true)

          React.useEffect(() => {
            const loadPluginData = async (): Promise<void> => {
              try {
                setLoading(true)
                const result = await invoke<PluginInitResult>('execute_plugin_command', {
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
                React.createElement('p', { className: 'text-dynamic', key: 'desc' }, plugin.manifest.description),
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
                      plugin.manifest.apiVersion,
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
        } // Register the page component
        const manifestSidebarItems = plugin.manifest.sidebarItems
        const legacySidebarItems = (plugin.manifest as unknown as Record<string, unknown>).sidebar_items as
          | PluginSidebarItemRaw[]
          | undefined

        if (manifestSidebarItems) {
          for (const sidebarItem of manifestSidebarItems) {
            this.registry.pages.set(sidebarItem.page, {
              component: PluginComponent,
              plugin,
            })
          }
        } else if (legacySidebarItems) {
          for (const sidebarItem of legacySidebarItems) {
            this.registry.pages.set(sidebarItem.page as ActivePageType, {
              component: PluginComponent,
              plugin,
            })
          }
        }
      }
    } catch (error) {
      console.error(`Failed to load frontend for plugin ${plugin.manifest.id}:`, error)
    }
  }
  private registerSidebarItems(items: PluginSidebarItemRaw[], pluginId: string): void {
    const pluginItems: SidebarItem[] = items.map(item => ({
      id: `${pluginId}-${item.id}`,
      page: item.page as ActivePageType,
      icon: item.icon, // Keep as string, SideBar component handles the conversion
      tooltipKey: item.tooltip, // Convert tooltip to tooltipKey
      shouldShow: item.shouldShow,
      isActive: item.isActive,
      customClassName: item.customClassName,
    }))
    this.registry.sidebarItems.push(...pluginItems)
  }

  private registerSidebarItemsFromManifest(items: SidebarItem[], pluginId: string): void {
    const pluginItems: SidebarItem[] = items.map(item => ({
      ...item,
      id: `${pluginId}-${item.id}`,
    }))
    this.registry.sidebarItems.push(...pluginItems)
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

  clearRegistry(): void {
    this.registry.pages.clear()
    this.registry.settingsComponents.clear()
    this.registry.sidebarItems = []
  }

  async refreshRegistry(plugins: Plugin[]): Promise<void> {
    this.clearRegistry()
    await this.loadPluginComponents(plugins)
  }
}

export const pluginRegistry = new PluginRegistryManager()
