import type { ReactElement } from 'react'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { usePluginContext } from '@/components/contexts/PluginContext'
import { pluginRegistry } from '@/utils/plugin-registry'

interface PluginPageProps {
  pluginId: string
}

export default function PluginPage({ pluginId }: PluginPageProps): ReactElement {
  const { t } = useTranslation()
  const { activePage } = useNavigationContext()
  const { enabledPlugins } = usePluginContext()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlugin = async () => {
      try {
        setLoading(true)
        setError(null)

        // Ensure plugin registry is updated
        await pluginRegistry.refreshRegistry(enabledPlugins)

        // Check if the plugin page exists
        const pageComponent = pluginRegistry.getPageComponent(activePage)
        if (!pageComponent) {
          setError(`Plugin page not found: ${activePage}`)
        }
      } catch (err) {
        setError(`Failed to load plugin: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    loadPlugin()
  }, [activePage, enabledPlugins])

  if (loading) {
    return (
      <div className='flex justify-center items-center w-calc h-calc'>
        <div className='flex flex-col items-center gap-4'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-dynamic'></div>
          <p className='text-altwhite'>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex justify-center items-center w-calc h-calc'>
        <div className='flex flex-col items-center gap-4 max-w-md text-center'>
          <div className='w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center'>
            <span className='text-2xl text-danger'>⚠</span>
          </div>
          <div>
            <h2 className='text-xl font-semibold mb-2'>{t('plugins.error.title')}</h2>
            <p className='text-altwhite'>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const pageComponent = pluginRegistry.getPageComponent(activePage)
  if (!pageComponent) {
    return (
      <div className='flex justify-center items-center w-calc h-calc'>
        <div className='flex flex-col items-center gap-4 max-w-md text-center'>
          <div className='w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center'>
            <span className='text-2xl text-warning'>?</span>
          </div>
          <div>
            <h2 className='text-xl font-semibold mb-2'>{t('plugins.notFound.title')}</h2>
            <p className='text-altwhite'>{t('plugins.notFound.message')}</p>
          </div>
        </div>
      </div>
    )
  }

  const { component: PluginComponent, plugin } = pageComponent

  return (
    <div className='w-calc min-h-calc max-h-calc bg-base overflow-y-auto overflow-x-hidden rounded-tl-xl border-t border-l border-border'>
      <PluginComponent plugin={plugin} />
    </div>
  )
}
