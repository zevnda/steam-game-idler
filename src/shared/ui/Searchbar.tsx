import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbX } from 'react-icons/tb'
import { cn, Input, Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'
import { useNavigationStore, useSearchStore, useStateStore, useUserStore } from '@/shared/stores'
import { useTitlebar } from '@/shared/ui'

interface SearchbarProps {
  isModalOpen?: boolean
  onModalClose?: () => void
}

export const Searchbar = ({ isModalOpen = false, onModalClose }: SearchbarProps) => {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState<string>('')
  const searchStore = useSearchStore()
  const showAchievements = useStateStore(state => state.showAchievements)
  const activePage = useNavigationStore(state => state.activePage)
  const currentTab = useNavigationStore(state => state.currentTab)
  const achievementsUnavailable = useUserStore(state => state.achievementsUnavailable)
  const statisticsUnavailable = useUserStore(state => state.statisticsUnavailable)
  const hasLoadedRecentSearches = useRef(false)
  useTitlebar()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const applySearchQuery = (query: string) => {
    if (activePage === 'games' && !showAchievements) {
      searchStore.setGameQueryValue(query)
    } else if (activePage === 'tradingCards' && !showAchievements) {
      searchStore.setTradingCardQueryValue(query)
    } else if (showAchievements && currentTab === 'achievements') {
      searchStore.setAchievementQueryValue(query)
    } else if (showAchievements && currentTab === 'statistics') {
      searchStore.setStatisticQueryValue(query)
    }
  }

  const getCurrentSearchQuery = useCallback(() => {
    if (activePage === 'games' && !showAchievements) {
      return searchStore.gameQueryValue
    }
    if (activePage === 'tradingCards' && !showAchievements) {
      return searchStore.tradingCardQueryValue
    }
    if (showAchievements && currentTab === 'achievements') {
      return searchStore.achievementQueryValue
    }
    if (showAchievements && currentTab === 'statistics') {
      return searchStore.statisticQueryValue
    }
    return ''
  }, [
    activePage,
    showAchievements,
    currentTab,
    searchStore.gameQueryValue,
    searchStore.tradingCardQueryValue,
    searchStore.achievementQueryValue,
    searchStore.statisticQueryValue,
  ])

  useEffect(() => {
    if (isModalOpen) {
      const currentQuery = getCurrentSearchQuery()
      setInputValue(currentQuery)
    }
  }, [isModalOpen, getCurrentSearchQuery])

  useEffect(() => {
    if (isModalOpen && !hasLoadedRecentSearches.current) {
      const stored = localStorage.getItem('searchQueries')
      if (stored) {
        const queries = JSON.parse(stored)
        queries.forEach((query: string) => searchStore.addRecentSearch(query))
      }
      hasLoadedRecentSearches.current = true
    }
    if (!isModalOpen) {
      hasLoadedRecentSearches.current = false
    }
  }, [isModalOpen, searchStore])

  const saveSearchQuery = (query: string) => {
    if (query.trim()) {
      const stored = localStorage.getItem('searchQueries')
      let queries: string[] = stored ? JSON.parse(stored) : []

      queries = queries.filter(q => q !== query.trim())
      queries.unshift(query.trim())
      queries = queries.slice(0, 10)

      localStorage.setItem('searchQueries', JSON.stringify(queries))
      searchStore.addRecentSearch(query.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement
      applySearchQuery(target.value)
      saveSearchQuery(target.value)
      searchStore.setIsQuery(true)
      onModalClose?.()
    }
  }

  const handleRecentSearchClick = (query: string) => {
    setInputValue(query)
    applySearchQuery(query)
    saveSearchQuery(query)
    searchStore.setIsQuery(true)
    onModalClose?.()
  }

  const handleClear = () => {
    setInputValue('')
    applySearchQuery('')
  }

  const getSearchConfig = () => {
    if (activePage === 'games' && !showAchievements) {
      return {
        isDisabled: false,
      }
    }

    if (activePage === 'tradingCards' && !showAchievements) {
      return {
        isDisabled: false,
      }
    }

    if (showAchievements && currentTab === 'achievements') {
      return {
        isDisabled: achievementsUnavailable,
      }
    }

    if (showAchievements && currentTab === 'statistics') {
      return {
        isDisabled: statisticsUnavailable,
      }
    }

    return {
      isDisabled: true,
    }
  }

  const searchConfig = getSearchConfig()

  return (
    <Modal
      hideCloseButton
      isOpen={isModalOpen}
      onClose={onModalClose}
      placement='top'
      size='lg'
      className='max-h-[75%] min-w-[40%] border border-border rounded-4xl'
      classNames={{
        base: 'bg-gradient-bg',
        body: 'p-0 gap-0',
      }}
    >
      <ModalContent>
        <ModalHeader className='flex gap-2 border-b border-border/40 p-3'>
          <Input
            isClearable
            isDisabled={searchConfig.isDisabled}
            placeholder={t('common.search')}
            startContent={<RiSearchLine size={24} className='text-content/60' />}
            className='w-full mb-0 pb-0'
            classNames={{
              inputWrapper: cn(
                'bg-transparent hover:bg-transparent! h-24',
                'rounded-lg group-data-[focus-within=true]:bg-transparent!',
                'group-data-[focus-visible=true]:ring-0! group-data-[focus-visible=true]:ring-offset-0!',
                'focus-visible:ring-0! focus-visible:ring-offset-0! focus:ring-0! focus:ring-offset-0!',
                'outline-none! focus:outline-none! focus-visible:outline-none! border-none shadow-none',
              ),
              input: ['!text-content text-xl! placeholder:text-xl placeholder:text-content/60'],
              clearButton: 'text-content/60 hover:text-content',
            }}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClear={handleClear}
            autoFocus
          />
        </ModalHeader>
        <ModalBody className='relative p-0 gap-0 overflow-y-auto'>
          {searchStore.recentSearches.length > 0 && (
            <div className='p-4 border-t border-border/40'>
              <div className='flex items-center gap-2'>
                <h3 className='text-sm font-bold text-altwhite'>{t('common.recentSearches')}</h3>
              </div>

              <div className='grid max-h-96 overflow-y-auto'>
                {searchStore.recentSearches
                  .slice()
                  .reverse()
                  .map(query => (
                    <div className='flex items-center justify-between gap-2' key={query}>
                      <div
                        key={query}
                        className={cn(
                          'flex justify-between items-center px-4 py-1 rounded-lg cursor-pointer w-full',
                          'hover:bg-item-hover transition-all duration-150 max-w-md',
                        )}
                        onClick={() => handleRecentSearchClick(query)}
                      >
                        <p className='text-lg font-medium text-content truncate'>{query}</p>
                      </div>

                      <div
                        className='flex items-center justify-center cursor-pointer bg-item-hover hover:bg-item-hover/80 rounded-full p-1 duration-150'
                        onClick={() => searchStore.removeRecentSearch(query)}
                      >
                        <TbX className='text-content' />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {searchStore.recentSearches.length === 0 && (
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
