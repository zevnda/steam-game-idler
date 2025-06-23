export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  main: string
  frontend?: string
  permissions: string[]
  api_version: string
  dependencies?: Record<string, string>
  sidebar_items?: SidebarItem[]
  context_menus?: ContextMenuItem[]
  settings_tabs?: SettingsTab[]
  entry_points?: PluginEntryPoints
  icon?: string
  homepage?: string
  repository?: string
  license?: string
}

export interface PluginEntryPoints {
  on_load?: string
  on_unload?: string
  on_game_start?: string
  on_game_stop?: string
  on_achievement_unlock?: string
}

export interface SidebarItem {
  id: string
  title: string
  icon: string
  page: string
  tooltip: string
  order?: number
  badge?: string
  badge_color?: string
}

export interface ContextMenuItem {
  id: string
  title: string
  icon: string
  contexts: string[]
  separator?: boolean
  submenu?: ContextMenuItem[]
}

export interface SettingsTab {
  id: string
  title: string
  icon: string
  component: string
  order?: number
}

export interface Plugin {
  manifest: PluginManifest
  enabled: boolean
  loaded: boolean
  path: string
  config?: any
}

export interface PluginAPI {
  // Core app functionality exposed to plugins
  invoke: (command: string, args?: any) => Promise<any>
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void
  getCurrentUser: () => any
  getGamesList: () => Promise<any[]>
  getAchievements: (appId: string) => Promise<any[]>
  // Add more APIs as needed
}

export interface PluginContext {
  plugins: Plugin[]
  enabledPlugins: Plugin[]
  loadPlugin: (pluginId: string) => Promise<void>
  unloadPlugin: (pluginId: string) => Promise<void>
  enablePlugin: (pluginId: string) => Promise<void>
  disablePlugin: (pluginId: string) => Promise<void>
  executePluginCommand: (pluginId: string, command: string, args?: any) => Promise<any>
  installPlugin: (pluginPath: string) => Promise<void>
  uninstallPlugin: (pluginId: string) => Promise<void>
  getPluginConfig: (pluginId: string) => Promise<any>
  savePluginConfig: (pluginId: string, config: any) => Promise<void>
  refreshPlugins: () => Promise<void>
}

export interface PluginComponentProps {
  plugin: Plugin
  config?: any
  onConfigChange?: (config: any) => void
}

export interface PluginPageComponent {
  component: React.ComponentType<PluginComponentProps>
  plugin: Plugin
}

export interface PluginRegistry {
  pages: Map<string, PluginPageComponent>
  settingsComponents: Map<string, React.ComponentType<PluginComponentProps>>
  sidebarItems: SidebarItem[]
  contextMenuItems: ContextMenuItem[]
  settingsTabs: SettingsTab[]
}

export type PluginPageType = `plugins/${string}`

export type ExtendedActivePageType =
  | 'setup'
  | 'games'
  | 'idling'
  | 'freeGames'
  | 'settings'
  | `customlists/${string}`
  | 'tradingCards'
  | PluginPageType

export interface PluginSidebarItem extends SidebarItem {
  pluginId: string
}

export interface PluginContextMenuItem extends ContextMenuItem {
  pluginId: string
}

export interface PluginSettingsTab extends SettingsTab {
  pluginId: string
}
