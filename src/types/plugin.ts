import type { SidebarItem } from '@/types/navigation'

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  author: string
  main: string
  frontend?: string
  permissions: string[]
  apiVersion: string
  dependencies?: Record<string, string>
  sidebarItems?: SidebarItem[]
  entryPoints?: PluginEntryPoints
  icon?: string
  homepage?: string
  repository?: string
  license?: string
}

export interface PluginConfig {
  [key: string]: string | number | boolean | object | null
}

export interface PluginHealthStatus {
  status: 'healthy' | 'warning' | 'error'
  message?: string
  lastChecked: string
}

export interface PluginCommandArgs {
  [key: string]: string | number | boolean | object | null
}

export interface PluginCommandResult {
  success: boolean
  data?: unknown
  error?: string
}

export interface PluginEntryPoints {
  onLoad?: string
  onUnload?: string
  onGameStartup?: string
  onGameStop?: string
  onAchievementUnlock?: string
}

export interface Plugin {
  manifest: PluginManifest
  enabled: boolean
  loaded: boolean
  path: string
  config?: PluginConfig
}

export interface PluginAPIContext {
  currentUser?: object
  gamesList?: object[]
  [key: string]: unknown
}

export interface PluginAPI {
  // Core app functionality exposed to plugins
  invoke: (command: string, args?: PluginCommandArgs) => Promise<PluginCommandResult>
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void
  getCurrentUser: () => PluginAPIContext
  getGamesList: () => Promise<object[]>
  getAchievements: (appId: string) => Promise<object[]>
  // Add more APIs as needed
}

export interface PluginContext {
  plugins: Plugin[]
  enabledPlugins: Plugin[]
  loadPlugin: (pluginId: string) => Promise<void>
  unloadPlugin: (pluginId: string) => Promise<void>
  enablePlugin: (pluginId: string) => Promise<void>
  disablePlugin: (pluginId: string) => Promise<void>
  executePluginCommand: (pluginId: string, command: string, args?: PluginCommandArgs) => Promise<PluginCommandResult>
  installPlugin: (pluginPath: string) => Promise<void>
  uninstallPlugin: (pluginId: string) => Promise<void>
  getPluginConfig: (pluginId: string) => Promise<PluginConfig>
  savePluginConfig: (pluginId: string, config: PluginConfig) => Promise<void>
  refreshPlugins: () => Promise<void>
  checkPluginHealth: (pluginId: string) => Promise<PluginHealthStatus>
}

export interface PluginComponentProps {
  plugin: Plugin
  config?: PluginConfig
  onConfigChange?: (config: PluginConfig) => void
}

export interface PluginPageComponent {
  component: React.ComponentType<PluginComponentProps>
  plugin: Plugin
}

export interface PluginRegistry {
  pages: Map<string, PluginPageComponent>
  settingsComponents: Map<string, React.ComponentType<PluginComponentProps>>
  sidebarItems: SidebarItem[]
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
