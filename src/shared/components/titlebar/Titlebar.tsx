import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbLayoutSidebar, TbLayoutSidebarFilled, TbX } from 'react-icons/tb'
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize } from 'react-icons/vsc'
import { cn } from '@heroui/react'
import { GoPro } from '@/shared/components/pro/GoPro'
import { SearchModal } from '@/shared/components/SearchModal'
import { HelpDesk } from '@/shared/components/titlebar/HelpDesk'
import { Menu } from '@/shared/components/titlebar/Menu'
import { Notifications } from '@/shared/components/titlebar/Notifications'
import { UpdateButton } from '@/shared/components/UpdateButton'
import { useTitlebar } from '@/shared/hooks/titlebar/useTitlebar'
import { useSessionStore, useUiStore, useUserStore } from '@/shared/stores'
import { isPortableCheck } from '@/shared/utils'

export function Titlebar() {
  const { t } = useTranslation()
  const { windowMinimize, windowToggleMaximize, windowClose } = useTitlebar()
  const loaderVisible = useSessionStore(s => s.loaderVisible)
  const updateAvailable = useSessionStore(s => s.updateAvailable)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const setSidebarCollapsed = useUiStore(s => s.setSidebarCollapsed)
  const setTransitionDuration = useUiStore(s => s.setTransitionDuration)
  const showSearchModal = useUiStore(s => s.showSearchModal)
  const setShowSearchModal = useUiStore(s => s.setShowSearchModal)
  const selectedGame = useUiStore(s => s.selectedGame)
  const activePage = useUiStore(s => s.activePage)
  const isPro = useUserStore(s => s.isPro)
  const gameQuery = useUiStore(s => s.gameQuery)
  const tradingCardQuery = useUiStore(s => s.tradingCardQuery)
  const achievementQuery = useUiStore(s => s.achievementQuery)
  const statisticQuery = useUiStore(s => s.statisticQuery)
  const customListQuery = useUiStore(s => s.customListQuery)
  const setGameQuery = useUiStore(s => s.setGameQuery)
  const setTradingCardQuery = useUiStore(s => s.setTradingCardQuery)
  const setAchievementQuery = useUiStore(s => s.setAchievementQuery)
  const setStatisticQuery = useUiStore(s => s.setStatisticQuery)
  const setCustomListQuery = useUiStore(s => s.setCustomListQuery)
  const [isPortable, setIsPortable] = useState<boolean | null>(null)

  useEffect(() => {
    isPortableCheck().then(setIsPortable)
  }, [])

  const hasQuery = !!(
    gameQuery ||
    tradingCardQuery ||
    achievementQuery ||
    statisticQuery ||
    customListQuery
  )
  const currentQuery =
    gameQuery || tradingCardQuery || achievementQuery || statisticQuery || customListQuery || ''
  const showSearch = !loaderVisible && activePage !== 'setup'

  return (
    <>
      <div
        className={cn(
          'absolute top-0 right-0 select-none pr-0 h-12 z-40 ease-in-out',
          sidebarCollapsed ? 'w-[calc(100vw-56px)]' : activePage === 'setup' ? 'w-full' : 'w-calc',
        )}
        style={{ transitionDuration, transitionProperty: 'width' }}
        data-tauri-drag-region
      >
        <div className='flex items-center h-12 w-full' data-tauri-drag-region>
          <div className='flex items-center h-full shrink-0'>
            {showSearch && (
              <div
                className={cn(
                  'flex justify-center items-center p-2 cursor-pointer group text-content hover:bg-sidebar/40 hover:text-content/80 h-12 w-12 rounded-br-xl',
                )}
                style={{
                  transitionProperty: 'margin-left, color, background-color',
                  transitionDuration: `${transitionDuration}, 150ms, 150ms`,
                  transitionTimingFunction: 'ease-in-out, ease, ease',
                }}
                onClick={() => {
                  setTransitionDuration('300ms')
                  setSidebarCollapsed(!sidebarCollapsed)
                  localStorage.setItem('sidebarCollapsed', String(!sidebarCollapsed))
                  setTimeout(() => setTransitionDuration('0ms'), 100)
                }}
              >
                {sidebarCollapsed ? (
                  <TbLayoutSidebarFilled fontSize={18} />
                ) : (
                  <TbLayoutSidebar fontSize={18} />
                )}
              </div>
            )}
            {!loaderVisible && isPro !== null && activePage !== 'setup' && (
              <div className='flex justify-center items-center h-full'>
                <GoPro />
              </div>
            )}
          </div>

          <div className='flex-1' data-tauri-drag-region />

          <div className='flex justify-end items-center h-full shrink-0'>
            {isPortable === false && updateAvailable && <UpdateButton />}
            <HelpDesk />
            {showSearch && (
              <>
                <Notifications />
                <Menu />
              </>
            )}
            <div
              className={cn(
                'flex justify-center items-center hover:bg-header-hover/10 h-12 w-12 px-2 duration-150 cursor-pointer hover:text-white transition-colors',
              )}
              onClick={windowMinimize}
            >
              <VscChromeMinimize fontSize={16} className='text-content' />
            </div>
            <div
              className={cn(
                'flex justify-center items-center hover:bg-header-hover/10 h-12 w-12 px-2.5 duration-150 cursor-pointer hover:text-white transition-colors',
              )}
              onClick={windowToggleMaximize}
            >
              <VscChromeMaximize fontSize={16} className='text-content' />
            </div>
            <div
              className={cn(
                'flex justify-center items-center hover:bg-danger/90 h-12 w-12 px-2 duration-150 cursor-pointer hover:text-white transition-colors',
              )}
              onClick={windowClose}
            >
              <VscChromeClose fontSize={16} className='text-content' />
            </div>
          </div>
        </div>

        {showSearch && activePage !== 'idling' && activePage !== 'freeGames' && (
          <div
            className='absolute inset-y-0 flex items-center pointer-events-none ease-in-out'
            style={{
              left: sidebarCollapsed ? 'calc(50vw - 56px)' : 'calc(50vw - 250px)',
              transform: 'translateX(-50%)',
              transitionDuration,
            }}
          >
            <div
              className={cn(
                'flex items-center gap-2 rounded-full h-9 w-72 pl-5 pr-3 select-none duration-150 cursor-pointer pointer-events-auto',
                selectedGame
                  ? 'bg-btn-achievement-header hover:bg-btn-achievement-header-hover'
                  : 'bg-item-active hover:bg-inputhover',
                !hasQuery && 'text-altwhite',
              )}
              onClick={() => setShowSearchModal(true)}
            >
              <span className='flex items-center gap-2 text-sm font-semibold truncate flex-1'>
                <RiSearchLine fontSize={18} className='shrink-0 text-altwhite' />
                {currentQuery || t('common.search')}
              </span>
              {hasQuery && (
                <div
                  className='shrink-0 flex items-center justify-center rounded-full hover:bg-item-active p-1 duration-150'
                  onClick={e => {
                    e.stopPropagation()
                    setGameQuery('')
                    setTradingCardQuery('')
                    setAchievementQuery('')
                    setStatisticQuery('')
                    setCustomListQuery('')
                  }}
                >
                  <TbX fontSize={14} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <SearchModal isModalOpen={showSearchModal} onModalClose={() => setShowSearchModal(false)} />
    </>
  )
}
