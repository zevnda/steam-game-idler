import type { Plugin } from '@/types/plugin'
import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

import { Button, Card, CardBody, CardHeader, cn, Switch } from '@heroui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbExternalLink, TbPlug, TbRefresh, TbTrash, TbUpload } from 'react-icons/tb'

import { usePluginContext } from '@/components/contexts/PluginContext'
import { logEvent } from '@/utils/tasks'
import { showDangerToast, showSuccessToast } from '@/utils/toasts'

export default function PluginManager(): ReactElement {
  const { t } = useTranslation()
  const { plugins, refreshPlugins, enablePlugin, disablePlugin, uninstallPlugin } = usePluginContext()
  const [loading, setLoading] = useState(false)

  const handleTogglePlugin = async (plugin: Plugin): Promise<void> => {
    try {
      if (plugin.enabled) {
        await disablePlugin(plugin.manifest.id)
      } else {
        await enablePlugin(plugin.manifest.id)
      }
    } catch (error) {
      console.error('Failed to toggle plugin:', error)
    }
  }

  const handleInstallPlugin = async (): Promise<void> => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Plugin Directory',
      })

      if (selected) {
        setLoading(true)
        await invoke('install_plugin_from_path', { pluginPath: selected })
        await refreshPlugins()
        showSuccessToast('Plugin installed successfully')
        logEvent('[Plugin] Plugin installed from directory')
      }
    } catch (error) {
      showDangerToast(`Failed to install plugin: ${error}`)
      logEvent(`[Error] Failed to install plugin: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUninstallPlugin = async (pluginId: string): Promise<void> => {
    try {
      await uninstallPlugin(pluginId)
      logEvent(`[Plugin] Uninstalled plugin: ${pluginId}`)
    } catch (error) {
      console.error('Failed to uninstall plugin:', error)
    }
  }

  const handleOpenPluginsDirectory = async (): Promise<void> => {
    try {
      await invoke('open_file_explorer', { path: 'plugins' })
      logEvent('[Plugin] Opened plugins directory')
    } catch (error) {
      showDangerToast(`Failed to open plugins directory: ${error}`)
      logEvent(`[Error] Failed to open plugins directory: ${error}`)
    }
  }

  const handleRefreshPlugins = async (): Promise<void> => {
    try {
      setLoading(true)
      await invoke('reload_plugins')
      await refreshPlugins()
      showSuccessToast('Plugins refreshed')
      logEvent('[Plugin] Plugins refreshed')
    } catch (error) {
      showDangerToast(`Failed to refresh plugins: ${error}`)
      logEvent(`[Error] Failed to refresh plugins: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-4 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold mb-2'>{t('plugins.manager.title')}</h2>
          <p className='text-altwhite'>{t('plugins.manager.description')}</p>
        </div>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='flat'
            startContent={<TbRefresh size={16} />}
            onPress={handleRefreshPlugins}
            isLoading={loading}
          >
            {t('common.refresh')}
          </Button>
          <Button
            size='sm'
            color='primary'
            startContent={<TbUpload size={16} />}
            onPress={handleInstallPlugin}
            isLoading={loading}
          >
            {t('plugins.install')}
          </Button>
        </div>
      </div>

      <div className='grid gap-4'>
        <Card className='bg-titlebar border border-border'>
          <CardHeader className='flex justify-between items-center'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-dynamic/20 rounded-lg'>
                <TbPlug size={20} className='text-dynamic' />
              </div>
              <div>
                <h3 className='font-semibold'>{t('plugins.quickActions')}</h3>
                <p className='text-sm text-altwhite'>{t('plugins.quickActionsDescription')}</p>
              </div>
            </div>
          </CardHeader>
          <CardBody className='pt-0'>
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='flat'
                startContent={<TbExternalLink size={16} />}
                onPress={handleOpenPluginsDirectory}
              >
                {t('plugins.openDirectory')}
              </Button>
            </div>
          </CardBody>
        </Card>

        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>
            {t('plugins.installed')} ({plugins.length})
          </h3>

          {plugins.length === 0 ? (
            <Card className='bg-titlebar border border-border'>
              <CardBody className='text-center py-8'>
                <div className='flex flex-col items-center gap-4'>
                  <div className='p-4 bg-altwhite/10 rounded-full'>
                    <TbPlug size={32} className='text-altwhite' />
                  </div>
                  <div>
                    <h4 className='font-semibold mb-2'>{t('plugins.noPlugins.title')}</h4>
                    <p className='text-altwhite text-sm'>{t('plugins.noPlugins.description')}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <div className='grid gap-4'>
              {plugins.map(plugin => (
                <Card key={plugin.manifest.id} className='bg-titlebar border border-border'>
                  <CardHeader className='flex justify-between items-start'>
                    <div className='flex items-start gap-3'>
                      <div
                        className={cn(
                          'p-2 rounded-lg flex-shrink-0',
                          plugin.enabled ? 'bg-success/20' : 'bg-altwhite/10',
                        )}
                      >
                        <TbPlug size={20} className={plugin.enabled ? 'text-success' : 'text-altwhite'} />
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                          <h4 className='font-semibold truncate'>{plugin.manifest.name}</h4>
                          <span className='text-xs bg-border/50 px-2 py-1 rounded'>v{plugin.manifest.version}</span>
                        </div>
                        <p className='text-sm text-altwhite line-clamp-2 mb-2'>{plugin.manifest.description}</p>
                        <div className='flex items-center gap-4 text-xs text-altwhite'>
                          <span>
                            {t('plugins.author')}: {plugin.manifest.author}
                          </span>
                          <span>
                            {t('plugins.apiVersion')}: {plugin.manifest.apiVersion}
                          </span>
                          {plugin.manifest.license && (
                            <span>
                              {t('plugins.license')}: {plugin.manifest.license}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Switch isSelected={plugin.enabled} onValueChange={() => handleTogglePlugin(plugin)} size='sm' />
                      <Button
                        size='sm'
                        variant='flat'
                        color='danger'
                        isIconOnly
                        onPress={() => handleUninstallPlugin(plugin.manifest.id)}
                      >
                        <TbTrash size={16} />
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
