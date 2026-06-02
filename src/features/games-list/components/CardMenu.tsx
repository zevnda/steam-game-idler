import type { Game } from '@/shared/types'
import { useTranslation } from 'react-i18next'
import { FaSteam } from 'react-icons/fa'
import { TbAwardFilled, TbDotsVertical, TbPlayerPlayFilled } from 'react-icons/tb'
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/react'
import { handleIdle } from '@/features/idle'
import { useUiStore } from '@/shared/stores'
import { checkSteamStatus, openExternalLink } from '@/shared/utils'

export function CardMenu({ item }: { item: Game }) {
  const { t } = useTranslation()
  const setSelectedGame = useUiStore(s => s.setSelectedGame)

  const handleViewAchievements = async () => {
    const running = await checkSteamStatus(true)
    if (!running) return
    setSelectedGame(item)
  }

  return (
    <Dropdown classNames={{ content: ['rounded-xl p-0 bg-transparent'] }}>
      <DropdownTrigger>
        <div className='p-1 bg-black/50 hover:bg-black hover:bg-opacity-80 cursor-pointer rounded-md duration-200'>
          <TbDotsVertical />
        </div>
      </DropdownTrigger>
      <DropdownMenu
        aria-label='actions'
        classNames={{ base: 'bg-popover border border-border rounded-xl' }}
      >
        <DropdownItem
          className='rounded-xl'
          classNames={{ base: ['data-[hover=true]:bg-item-hover'] }}
          key='idle'
          startContent={<TbPlayerPlayFilled size={16} className='text-content' />}
          onPress={() => handleIdle(item)}
          textValue='Idle game'
        >
          <p className='text-sm text-content truncate'>{t('cardMenu.idle')}</p>
        </DropdownItem>
        <DropdownItem
          className='rounded-xl'
          classNames={{ base: ['data-[hover=true]:bg-item-hover'] }}
          key='achievements'
          startContent={<TbAwardFilled size={16} className='text-content' />}
          onPress={handleViewAchievements}
          textValue='View achievements'
        >
          <p className='text-sm text-content truncate'>{t('cardMenu.achievements')}</p>
        </DropdownItem>
        <DropdownItem
          className='rounded-xl'
          classNames={{ base: ['data-[hover=true]:bg-item-hover'] }}
          key='store'
          startContent={<FaSteam fontSize={16} className='text-content' />}
          onPress={() => openExternalLink(`https://store.steampowered.com/app/${item.appid}`)}
          textValue='View store page'
        >
          <p className='text-sm text-content truncate'>{t('cardMenu.store')}</p>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}
