import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbLayoutSidebar, TbLayoutSidebarFilled, TbX } from 'react-icons/tb'
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize } from 'react-icons/vsc'
import { cn } from '@heroui/react'
import {
  GoPro,
  HelpDesk,
  Menu,
  Notifications,
  SearchModal,
  UpdateButton,
} from '@/shared/components'
import { useTitlebar } from '@/shared/hooks'
import {
  useLoaderStore,
  useNavigationStore,
  useSearchStore,
  useStateStore,
  useUpdateStore,
  useUserStore,
} from '@/shared/stores'
import { isPortableCheck } from '@/shared/utils'

export const Titlebar = () => {
  const { t } = useTranslation()
  const { windowMinimize, windowToggleMaximize, windowClose } = useTitlebar()
  const loaderVisible = useLoaderStore(state => state.loaderVisible)
  const updateAvailable = useUpdateStore(state => state.updateAvailable)
  const sidebarCollapsed = useStateStore(state => state.sidebarCollapsed)
  const transitionDuration = useStateStore(state => state.transitionDuration)
  const setSidebarCollapsed = useStateStore(state => state.setSidebarCollapsed)
  const setTransitionDuration = useStateStore(state => state.setTransitionDuration)
  const showSearchModal = useStateStore(state => state.showSearchModal)
  const setShowSearchModal = useStateStore(state => state.setShowSearchModal)
  const showAchievements = useStateStore(state => state.showAchievements)
  const activePage = useNavigationStore(state => state.activePage)
  const isSubscribed = useUserStore(state => state.isSubscribed)
  const searchContent = useSearchStore()
  const [isPortable, setIsPortable] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      const portable = await isPortableCheck()
      setIsPortable(portable)
    })()
  }, [])

  const hasActiveQuery = !!(
    searchContent.gameQueryValue ||
    searchContent.tradingCardQueryValue ||
    searchContent.achievementQueryValue ||
    searchContent.statisticQueryValue ||
    searchContent.customListQueryValue
  )

  const currentQueryValue =
    searchContent.gameQueryValue ||
    searchContent.tradingCardQueryValue ||
    searchContent.achievementQueryValue ||
    searchContent.statisticQueryValue ||
    searchContent.customListQueryValue ||
    ''

  const showSearch = !loaderVisible && activePage !== 'setup'

  return (
    <>
      <div
        className={cn(
          'absolute top-0 right-0 select-none pr-0 h-12 z-40 ease-in-out',
          sidebarCollapsed ? 'w-[calc(100vw-56px)]' : activePage === 'setup' ? 'w-full' : 'w-calc',
        )}
        style={{
          transitionDuration,
          transitionProperty: 'width',
        }}
        data-tauri-drag-region
      >
        <div className='flex items-center h-12 w-full' data-tauri-drag-region>
          {/* Left: sidebar toggle */}
          <div className='flex items-center h-full shrink-0'>
            {showSearch && (
              <div
                className={cn(
                  'flex justify-center items-center p-2 cursor-pointer group',
                  'text-content hover:bg-sidebar/40 hover:text-content/80 h-12 w-12',
                  'rounded-br-xl',
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
                  setTimeout(() => {
                    setTransitionDuration('0ms')
                  }, 100)
                }}
              >
                {sidebarCollapsed ? (
                  <TbLayoutSidebarFilled fontSize={18} />
                ) : (
                  <TbLayoutSidebar fontSize={18} />
                )}
              </div>
            )}

            {!loaderVisible && isSubscribed !== null && activePage !== 'setup' && (
              <div className='flex justify-center items-center h-full'>
                <GoPro />
              </div>
            )}
          </div>

          {/* Spacer — fills the middle so left/right sections stay flush */}
          <div className='flex-1' data-tauri-drag-region />

          {/* Right: action buttons + window controls */}
          <div className='flex justify-end items-center h-full shrink-0'>
            {isPortable === false && updateAvailable && <UpdateButton />}

            <HelpDesk />

            {showSearch && (
              <>
                <Notifications />
                <Menu />
              </>
            )}

            <div className='flex justify-center items-center'>
              <div
                className={cn(
                  'flex justify-center items-center',
                  'hover:bg-header-hover/10 h-12 w-12 px-2 duration-150 cursor-pointer',
                  'hover:text-white transition-colors',
                )}
                onClick={windowMinimize}
              >
                <VscChromeMinimize fontSize={16} className='text-content' />
              </div>
            </div>

            <div className='flex justify-center items-center'>
              <div
                className={cn(
                  'flex justify-center items-center',
                  'hover:bg-header-hover/10 h-12 w-12 px-2.5 duration-150 cursor-pointer',
                  'hover:text-white transition-colors',
                )}
                onClick={windowToggleMaximize}
              >
                <VscChromeMaximize fontSize={16} className='text-content' />
              </div>
            </div>

            <div className='flex justify-center items-center'>
              <div
                className={cn(
                  'flex justify-center items-center',
                  'hover:bg-danger/90 h-12 w-12 px-2 duration-150 cursor-pointer',
                  'hover:text-white transition-colors',
                )}
                onClick={windowClose}
              >
                <VscChromeClose fontSize={16} className='text-content' />
              </div>
            </div>
          </div>
        </div>

        {/* Search button — absolutely centered on the full viewport so it aligns with the modal */}
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
                'flex items-center gap-2 rounded-full h-9 w-72 pl-5 pr-3',
                'select-none duration-150 cursor-pointer pointer-events-auto',
                showAchievements
                  ? 'bg-btn-achievement-header hover:bg-btn-achievement-header-hover'
                  : 'bg-item-active hover:bg-inputhover',
                !hasActiveQuery && 'text-altwhite',
              )}
              onClick={() => setShowSearchModal(true)}
            >
              <span className='flex items-center gap-2 text-sm font-semibold truncate flex-1'>
                <RiSearchLine fontSize={18} className='shrink-0 text-altwhite' />
                {currentQueryValue || t('common.search')}
              </span>

              {hasActiveQuery && (
                <div
                  className='shrink-0 flex items-center justify-center rounded-full hover:bg-item-active p-1 duration-150'
                  onClick={e => {
                    e.stopPropagation()
                    searchContent.setGameQueryValue('')
                    searchContent.setTradingCardQueryValue('')
                    searchContent.setAchievementQueryValue('')
                    searchContent.setStatisticQueryValue('')
                    searchContent.setCustomListQueryValue('')
                    searchContent.setIsQuery(false)
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
