import type { Game } from '@/types'
import type { ReactElement } from 'react'

import { open } from '@tauri-apps/plugin-shell'

import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { FaSteam } from 'react-icons/fa'
import { TbAwardFilled, TbDotsVertical, TbPlayerPlayFilled } from 'react-icons/tb'

import { useStateContext } from '@/components/contexts/StateContext'
import { handleIdle, viewAchievments } from '@/hooks/ui/useGameCard'

interface CardMenuProps {
  item: Game
}

export default function CardMenu({ item }: CardMenuProps): ReactElement {
  const { t } = useTranslation()
  const { setAppId, setAppName, setShowAchievements } = useStateContext()

  const viewStorePage = async (item: Game): Promise<void> => {
    try {
      await open(`https://store.steampowered.com/app/${item.appid}`)
    } catch (error) {
      console.error('Failed to open link:', error)
    }
  }

  return (
    <Dropdown
      classNames={{
        content: ['rounded-xl p-0 bg-transparent'],
      }}
    >
      <DropdownTrigger>
        <div className='p-1 bg-black/50 hover:bg-black hover:bg-opacity-80 cursor-pointer rounded-md duration-200'>
          <TbDotsVertical />
        </div>
      </DropdownTrigger>
      <DropdownMenu aria-label='actions' classNames={{ base: 'bg-popover border border-border rounded-xl' }}>
        <DropdownItem
          className='rounded-xl'
          classNames={{ base: ['data-[hover=true]:bg-item-hover'] }}
          key='idle'
          startContent={<TbPlayerPlayFilled size={16} className='text-content' />}
          onPress={() => handleIdle(item)}
          textValue='Idle game'
        >
          <p className='text-sm text-content'>{t('cardMenu.idle')}</p>
        </DropdownItem>
        <DropdownItem
          className='rounded-xl'
          classNames={{ base: ['data-[hover=true]:bg-item-hover'] }}
          key='achievements'
          startContent={<TbAwardFilled size={16} className='text-content' />}
          onPress={() => viewAchievments(item, setAppId, setAppName, setShowAchievements)}
          textValue='View achievements'
        >
          <p className='text-sm text-content'>{t('cardMenu.achievements')}</p>
        </DropdownItem>
        <DropdownItem
          className='rounded-xl'
          classNames={{ base: ['data-[hover=true]:bg-item-hover'] }}
          key='store'
          startContent={<FaSteam fontSize={16} className='text-content' />}
          onPress={() => viewStorePage(item)}
          textValue='View store page'
        >
          <p className='text-sm text-content'>{t('cardMenu.store')}</p>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
