import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbX } from 'react-icons/tb'
import { cn, Input, Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'
import { useUiStore, useUserStore } from '@/shared/stores'

interface SearchModalProps {
  isModalOpen?: boolean
  onModalClose?: () => void
}

export function SearchModal({ isModalOpen = false, onModalClose }: SearchModalProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')
  const uiStore = useUiStore()
  const achievementsUnavailable = useUserStore(s => s.achievementsUnavailable)
  const statisticsUnavailable = useUserStore(s => s.statisticsUnavailable)
  const hasLoadedRef = useRef(false)

  const {
    activePage,
    selectedGame,
    currentTab,
    gameQuery,
    tradingCardQuery,
    achievementQuery,
    statisticQuery,
    customListQuery,
  } = uiStore

  const getCurrentQuery = useCallback(() => {
    if (activePage === 'games' && !selectedGame) return gameQuery
    if (activePage === 'inventoryManager' && !selectedGame) return tradingCardQuery
    if (activePage.includes('customlists') && !selectedGame) return customListQuery
    if (selectedGame && currentTab === 'achievements') return achievementQuery
    if (selectedGame && currentTab === 'statistics') return statisticQuery
    return ''
  }, [
    activePage,
    selectedGame,
    currentTab,
    gameQuery,
    tradingCardQuery,
    customListQuery,
    achievementQuery,
    statisticQuery,
  ])

  const applyQuery = (query: string) => {
    if (activePage === 'games' && !selectedGame) return uiStore.setGameQuery(query)
    if (activePage === 'inventoryManager' && !selectedGame)
      return uiStore.setTradingCardQuery(query)
    if (activePage.includes('customlists') && !selectedGame)
      return uiStore.setCustomListQuery(query)
    if (selectedGame && currentTab === 'achievements') return uiStore.setAchievementQuery(query)
    if (selectedGame && currentTab === 'statistics') return uiStore.setStatisticQuery(query)
  }

  const isDisabled = () => {
    if (
      (activePage === 'games' ||
        activePage.includes('customlists') ||
        activePage === 'inventoryManager') &&
      !selectedGame
    )
      return false
    if (selectedGame && currentTab === 'achievements') return achievementsUnavailable
    if (selectedGame && currentTab === 'statistics') return statisticsUnavailable
    return true
  }

  useEffect(() => {
    if (isModalOpen) setInputValue(getCurrentQuery())
  }, [isModalOpen, getCurrentQuery])

  useEffect(() => {
    if (isModalOpen && !hasLoadedRef.current) {
      const stored = localStorage.getItem('searchQueries')
      if (stored)
        JSON.parse(stored).forEach((q: string) => useUiStore.getState().addRecentSearch(q))
      hasLoadedRef.current = true
    }
    if (!isModalOpen) hasLoadedRef.current = false
  }, [isModalOpen])

  const saveQuery = (query: string) => {
    if (!query.trim()) return
    const stored = localStorage.getItem('searchQueries')
    let queries: string[] = stored ? JSON.parse(stored) : []
    queries = [query.trim(), ...queries.filter(q => q !== query.trim())].slice(0, 10)
    localStorage.setItem('searchQueries', JSON.stringify(queries))
    uiStore.addRecentSearch(query.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const { value } = e.currentTarget
    if (e.key === 'Enter') {
      applyQuery(value)
      saveQuery(value)
      onModalClose?.()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      if (value) {
        setInputValue('')
        applyQuery('')
      } else {
        onModalClose?.()
      }
    }
  }

  const handleClear = () => {
    setInputValue('')
    applyQuery('')
  }
  const handleRecentClick = (query: string) => {
    setInputValue(query)
    applyQuery(query)
    saveQuery(query)
    onModalClose?.()
  }

  return (
    <Modal
      hideCloseButton
      isOpen={isModalOpen}
      onClose={onModalClose}
      placement='top'
      size='lg'
      className='max-h-[75%] min-w-[40%] border border-border rounded-4xl'
      classNames={{ base: 'bg-gradient-bg', body: 'p-0 gap-0' }}
    >
      <ModalContent>
        <ModalHeader className='flex gap-2 border-b border-border/40 p-3'>
          <Input
            isClearable
            isDisabled={isDisabled()}
            placeholder={t('common.search')}
            startContent={<RiSearchLine size={24} className='text-content/60' />}
            className='w-full mb-0 pb-0'
            classNames={{
              inputWrapper: cn(
                'bg-transparent hover:bg-transparent! h-24 rounded-lg group-data-[focus-within=true]:bg-transparent! group-data-[focus-visible=true]:ring-0! group-data-[focus-visible=true]:ring-offset-0! focus-visible:ring-0! focus-visible:ring-offset-0! focus:ring-0! focus:ring-offset-0! outline-none! focus:outline-none! focus-visible:outline-none! border-none shadow-none',
              ),
              input: ['!text-content text-xl! placeholder:text-xl placeholder:text-content/60'],
              clearButton: 'text-content/60 hover:text-content',
            }}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onClear={handleClear}
            autoFocus
          />
        </ModalHeader>
        <ModalBody className='relative p-0 gap-0 overflow-y-auto'>
          {uiStore.recentSearches.length > 0 ? (
            <div className='p-4 border-t border-border/40'>
              <h3 className='text-sm font-bold text-altwhite mb-2'>{t('common.recentSearches')}</h3>
              <div className='grid max-h-96 overflow-y-auto'>
                {[...uiStore.recentSearches].reverse().map(query => (
                  <div className='flex items-center justify-between gap-2' key={query}>
                    <div
                      className={cn(
                        'flex justify-between items-center px-4 py-1 rounded-lg cursor-pointer w-full hover:bg-item-hover transition-all duration-150 max-w-md',
                      )}
                      onClick={() => handleRecentClick(query)}
                    >
                      <p className='text-lg font-medium text-content truncate'>{query}</p>
                    </div>
                    <div
                      className='flex items-center justify-center cursor-pointer bg-item-hover hover:bg-item-hover/80 rounded-full p-1 duration-150'
                      onClick={() => uiStore.removeRecentSearch(query)}
                    >
                      <TbX className='text-content' />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className='text-center py-8 border-t border-border/40'>
              <RiSearchLine size={32} className='text-altwhite mx-auto mb-3' />
              <p className='text-altwhite'>{t('common.noRecentSearches')}</p>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
