import type {
  Plugin,
  PluginCommandArgs,
  PluginCommandResult,
  PluginConfig,
  PluginContext,
  PluginHealthStatus,
} from '@/types/plugin'
import type { ReactElement, ReactNode } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { createContext, useContext, useEffect, useState } from 'react'

import { logEvent } from '@/utils/tasks'
import { showDangerToast, showSuccessToast } from '@/utils/toasts'

const PluginContext = createContext<PluginContext | undefined>(undefined)

export const PluginProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [enabledPlugins, setEnabledPlugins] = useState<Plugin[]>([])

  const refreshPlugins = async (): Promise<void> => {
    try {
      const result = await invoke<Plugin[]>('get_plugins')
      setPlugins(result)
      setEnabledPlugins(result.filter(plugin => plugin.enabled))
    } catch (error) {
      console.error('Failed to load plugins:', error)
      logEvent(`[Error] Failed to load plugins: ${error}`)
    }
  }

  const enablePlugin = async (pluginId: string): Promise<void> => {
    try {
      await invoke('enable_plugin_command', { pluginId })
      await refreshPlugins()
      showSuccessToast(`Plugin ${pluginId} enabled`)
      logEvent(`[Plugin] Enabled plugin: ${pluginId}`)
    } catch (error) {
      showDangerToast(`Failed to enable plugin: ${error}`)
      logEvent(`[Error] Failed to enable plugin ${pluginId}: ${error}`)
    }
  }

  const disablePlugin = async (pluginId: string): Promise<void> => {
    try {
      await invoke('disable_plugin_command', { pluginId })
      await refreshPlugins()
      showSuccessToast(`Plugin ${pluginId} disabled`)
      logEvent(`[Plugin] Disabled plugin: ${pluginId}`)
    } catch (error) {
      showDangerToast(`Failed to disable plugin: ${error}`)
      logEvent(`[Error] Failed to disable plugin ${pluginId}: ${error}`)
    }
  }

  const loadPlugin = async (pluginId: string): Promise<void> => {
    try {
      // Call plugin load hook
      await invoke('call_plugin_hook', {
        hook: 'onLoad',
        data: { pluginId },
      })
      await refreshPlugins()
      logEvent(`[Plugin] Loaded plugin: ${pluginId}`)
    } catch (error) {
      console.error(`Failed to load plugin ${pluginId}:`, error)
      logEvent(`[Error] Failed to load plugin ${pluginId}: ${error}`)
    }
  }

  const unloadPlugin = async (pluginId: string): Promise<void> => {
    try {
      // Call plugin unload hook
      await invoke('call_plugin_hook', {
        hook: 'onUnload',
        data: { pluginId },
      })
      await refreshPlugins()
      logEvent(`[Plugin] Unloaded plugin: ${pluginId}`)
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error)
      logEvent(`[Error] Failed to unload plugin ${pluginId}: ${error}`)
    }
  }
  const checkPluginHealth = async (pluginId: string): Promise<PluginHealthStatus> => {
    try {
      const health = await invoke<PluginHealthStatus>('check_plugin_health', { pluginId })
      return health
    } catch (error) {
      console.error(`Failed to check plugin health for ${pluginId}:`, error)
      logEvent(`[Error] Failed to check plugin health for ${pluginId}: ${error}`)
      throw error
    }
  }

  const executePluginCommand = async (
    pluginId: string,
    command: string,
    args: PluginCommandArgs = {},
  ): Promise<PluginCommandResult> => {
    try {
      const result = await invoke<PluginCommandResult>('execute_plugin_command', {
        pluginId,
        command,
        args,
      })
      logEvent(`[Plugin] Executed command ${command} for plugin ${pluginId}`)
      return result
    } catch (error) {
      console.error(`Failed to execute plugin command ${command} for ${pluginId}:`, error)
      logEvent(`[Error] Failed to execute plugin command ${command} for ${pluginId}: ${error}`)
      throw error
    }
  }

  const installPlugin = async (pluginPath: string): Promise<void> => {
    try {
      await invoke('install_plugin_from_path', { pluginPath })
      await refreshPlugins()
      showSuccessToast('Plugin installed successfully')
      logEvent(`[Plugin] Installed plugin from: ${pluginPath}`)
    } catch (error) {
      showDangerToast(`Failed to install plugin: ${error}`)
      logEvent(`[Error] Failed to install plugin: ${error}`)
      throw error
    }
  }

  const uninstallPlugin = async (pluginId: string): Promise<void> => {
    try {
      await invoke('uninstall_plugin', { pluginId })
      await refreshPlugins()
      showSuccessToast(`Plugin ${pluginId} uninstalled`)
      logEvent(`[Plugin] Uninstalled plugin: ${pluginId}`)
    } catch (error) {
      showDangerToast(`Failed to uninstall plugin: ${error}`)
      logEvent(`[Error] Failed to uninstall plugin ${pluginId}: ${error}`)
      throw error
    }
  }
  const getPluginConfig = async (pluginId: string): Promise<PluginConfig> => {
    try {
      const config = await invoke<PluginConfig>('get_plugin_config', { pluginId })
      return config
    } catch (error) {
      console.error('Failed to get plugin config:', error)
      logEvent(`[Error] Failed to get config for plugin ${pluginId}: ${error}`)
      return {}
    }
  }

  const savePluginConfig = async (pluginId: string, config: PluginConfig): Promise<void> => {
    try {
      await invoke('save_plugin_config', { pluginId, config })
      logEvent(`[Plugin] Saved config for plugin: ${pluginId}`)
    } catch (error) {
      showDangerToast(`Failed to save plugin config: ${error}`)
      logEvent(`[Error] Failed to save config for plugin ${pluginId}: ${error}`)
      throw error
    }
  }

  useEffect(() => {
    refreshPlugins()
  }, [])
  const contextValue: PluginContext = {
    plugins,
    enabledPlugins,
    loadPlugin,
    unloadPlugin,
    enablePlugin,
    disablePlugin,
    executePluginCommand,
    installPlugin,
    uninstallPlugin,
    getPluginConfig,
    savePluginConfig,
    refreshPlugins,
    checkPluginHealth,
  }

  return <PluginContext.Provider value={contextValue}>{children}</PluginContext.Provider>
}

export function usePluginContext(): PluginContext {
  const context = useContext(PluginContext)
  if (context === undefined) {
    throw new Error('usePluginContext must be used within a PluginProvider')
  }
  return context
}
