import type { Game } from '@/types'
import type { ReactElement } from 'react'

import { open } from '@tauri-apps/plugin-shell'

import { cn, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { FaSteam } from 'react-icons/fa'
import { TbAwardFilled, TbDotsVertical, TbPlayerPlayFilled, TbSettingsFilled } from 'react-icons/tb'

import { usePluginContext } from '@/components/contexts/PluginContext'
import { useStateContext } from '@/components/contexts/StateContext'
import { handleIdle, viewAchievments, viewGameSettings } from '@/hooks/ui/useGameCard'
import { pluginRegistry } from '@/utils/plugin-registry'

interface CardMenuProps {
  item: Game
  onOpen: () => void
}

export default function CardMenu({ item, onOpen }: CardMenuProps): ReactElement {
  const { t } = useTranslation()
  const { setAppId, setAppName, setShowAchievements, setIsGameSettingsOpen } = useStateContext()
  const { executePluginCommand } = usePluginContext()

  const viewStorePage = async (item: Game): Promise<void> => {
    try {
      await open(`https://store.steampowered.com/app/${item.appid}`)
    } catch (error) {
      console.error('Failed to open link:', error)
    }
  }

  const handlePluginContextMenu = async (pluginId: string, menuItemId: string): Promise<void> => {
    try {
      await executePluginCommand(pluginId, 'context_menu_action', {
        menuItemId,
        context: 'game-card',
        game: item,
      })
    } catch (error) {
      console.error('Failed to execute plugin context menu command:', error)
    }
  }

  // Get plugin context menu items for the "game-card" context
  const pluginContextMenuItems = pluginRegistry.getContextMenuItems('game-card')

  return (
    <Dropdown
      classNames={{
        content: ['rounded-lg p-0 bg-titlebar border border-border'],
      }}
    >
      <DropdownTrigger>
        <div
          className={cn(
            'p-1 bg-black text-offwhite bg-opacity-50',
            'hover:bg-black hover:bg-opacity-70 hover:scale-105',
            'cursor-pointer rounded-md duration-200',
          )}
        >
          <TbDotsVertical />
        </div>
      </DropdownTrigger>
      <DropdownMenu aria-label='actions'>
        <DropdownItem
          className='rounded'
          classNames={{ base: ['data-[hover=true]:bg-titlehover'] }}
          key='idle'
          startContent={<TbPlayerPlayFilled size={16} className='text-content' />}
          onPress={() => handleIdle(item)}
          textValue='Idle game'
        >
          <p className='text-sm text-content'>{t('cardMenu.idle')}</p>
        </DropdownItem>
        <DropdownItem
          className='rounded'
          classNames={{ base: ['data-[hover=true]:bg-titlehover'] }}
          key='achievements'
          startContent={<TbAwardFilled size={16} className='text-content' />}
          onPress={() => viewAchievments(item, setAppId, setAppName, setShowAchievements)}
          textValue='View achievements'
        >
          <p className='text-sm text-content'>{t('cardMenu.achievements')}</p>
        </DropdownItem>
        <DropdownItem
          className='rounded'
          classNames={{ base: ['data-[hover=true]:bg-titlehover'] }}
          key='store'
          startContent={<FaSteam fontSize={16} className='text-content' />}
          onPress={() => viewStorePage(item)}
          textValue='View store page'
        >
          <p className='text-sm text-content'>{t('cardMenu.store')}</p>
        </DropdownItem>
        <DropdownItem
          className='rounded'
          classNames={{ base: ['data-[hover=true]:bg-titlehover'] }}
          key='settings'
          startContent={<TbSettingsFilled fontSize={16} className='text-content' />}
          onPress={() => viewGameSettings(item, setAppId, setAppName, setIsGameSettingsOpen, onOpen)}
          textValue='Game settings'
        >
          <p className='text-sm text-content'>{t('cardMenu.settings')}</p>
        </DropdownItem>

        {/* Plugin context menu items */}
        {pluginContextMenuItems.map(menuItem => (
          <DropdownItem
            key={menuItem.id}
            className='rounded'
            classNames={{ base: ['data-[hover=true]:bg-titlehover'] }}
            onPress={() => handlePluginContextMenu(menuItem.pluginId!, menuItem.id)}
            textValue={menuItem.title}
          >
            <p className='text-sm text-content'>{menuItem.title}</p>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}
