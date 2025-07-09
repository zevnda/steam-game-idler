import type { ChangeEvent, ReactElement } from 'react'

import { cn, Input, Modal, ModalBody, ModalContent } from '@heroui/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbX } from 'react-icons/tb'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useSearchContext } from '@/components/contexts/SearchContext'
import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import useHeader from '@/hooks/ui/useHeader'

interface SearchBarProps {
  isModalOpen?: boolean
  onModalClose?: () => void
}

export default function SearchBar({ isModalOpen = false, onModalClose }: SearchBarProps): ReactElement {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState<string>('')
  const searchContext = useSearchContext()
  const { showAchievements } = useStateContext()
  const { activePage, currentTab } = useNavigationContext()
  const { achievementsUnavailable, statisticsUnavailable } = useUserContext()

  useHeader()

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value)
  }

  const applySearchQuery = (query: string): void => {
    if (activePage === 'games' && !showAchievements) {
      searchContext.setGameQueryValue(query)
    } else if (activePage === 'tradingCards' && !showAchievements) {
      searchContext.setTradingCardQueryValue(query)
    } else if (showAchievements && currentTab === 'achievements') {
      searchContext.setAchievementQueryValue(query)
    } else if (showAchievements && currentTab === 'statistics') {
      searchContext.setStatisticQueryValue(query)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      const stored = localStorage.getItem('searchQueries')
      if (stored) {
        const queries = JSON.parse(stored)
        queries.forEach((query: string) => searchContext.addRecentSearch(query))
      }
      const currentQuery = getCurrentSearchQuery()
      setInputValue(currentQuery)
    }
  }, [isModalOpen])

  const getCurrentSearchQuery = (): string => {
    if (activePage === 'games' && !showAchievements) {
      return searchContext.gameQueryValue
    }
    if (activePage === 'tradingCards' && !showAchievements) {
      return searchContext.tradingCardQueryValue
    }
    if (showAchievements && currentTab === 'achievements') {
      return searchContext.achievementQueryValue
    }
    if (showAchievements && currentTab === 'statistics') {
      return searchContext.statisticQueryValue
    }
    return ''
  }

  const saveSearchQuery = (query: string): void => {
    if (query.trim()) {
      const stored = localStorage.getItem('searchQueries')
      let queries: string[] = stored ? JSON.parse(stored) : []

      queries = queries.filter(q => q !== query.trim())
      queries.unshift(query.trim())
      queries = queries.slice(0, 10)

      localStorage.setItem('searchQueries', JSON.stringify(queries))
      searchContext.addRecentSearch(query.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement
      applySearchQuery(target.value)
      saveSearchQuery(target.value)
      searchContext.setIsQuery(true)
      onModalClose?.()
    }
  }

  const handleRecentSearchClick = (query: string): void => {
    setInputValue(query)
    applySearchQuery(query)
    saveSearchQuery(query)
    searchContext.setIsQuery(true)
    onModalClose?.()
  }

  const handleClear = (): void => {
    setInputValue('')
    applySearchQuery('')
  }

  const getSearchConfig = (): {
    isDisabled: boolean
  } => {
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
      classNames={{
        base: 'bg-base/85 backdrop-blur-sm',
        body: 'p-0 gap-0',
      }}
    >
      <ModalContent>
        <ModalBody>
          <Input
            isClearable
            isDisabled={searchConfig.isDisabled}
            placeholder={t('common.search')}
            startContent={<RiSearchLine size={24} className='text-content/60' />}
            className='w-full mb-0 pb-0'
            classNames={{
              inputWrapper: cn(
                'bg-transparent hover:!bg-transparent h-24 ',
                'rounded-lg group-data-[focus-within=true]:!bg-transparent',
                'group-data-[focus-visible=true]:!ring-0 group-data-[focus-visible=true]:!ring-offset-0',
                'focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!ring-0 focus:!ring-offset-0',
                '!outline-none focus:!outline-none focus-visible:!outline-none',
                'border-none shadow-sm',
              ),
              input: ['!text-content !text-xl placeholder:text-xl placeholder:text-content/60'],
              clearButton: 'text-content/60 hover:text-content',
            }}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClear={handleClear}
            autoFocus
          />

          {searchContext.recentSearches.length > 0 && (
            <div className='p-4 border-t border-border/40'>
              <div className='flex items-center gap-2'>
                <h3 className='text-sm font-bold text-altwhite'>Recent searches</h3>
              </div>

              <div className='grid max-h-64 overflow-y-auto'>
                {searchContext.recentSearches
                  .slice()
                  .reverse()
                  .map(query => (
                    <div className='flex items-center justify-between gap-2' key={query}>
                      <div
                        key={query}
                        className={cn(
                          'flex justify-between items-center px-4 py-1 rounded-lg cursor-pointer transition-all duration-150',
                          'hover:bg-searchhover/40 w-full',
                        )}
                        onClick={() => handleRecentSearchClick(query)}
                      >
                        <p className='text-lg font-medium text-content truncate'>{query}</p>
                      </div>

                      <div
                        className='flex items-center justify-center cursor-pointer bg-item-hover hover:bg-item-hover/80 rounded-full p-1 duration-150'
                        onClick={() => searchContext.removeRecentSearch(query)}
                      >
                        <TbX />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {searchContext.recentSearches.length === 0 && (
            <div className='text-center py-8 border-t border-border/40'>
              <RiSearchLine size={32} className='text-altwhite mx-auto mb-3' />
              <p className='text-altwhite'>No recent searches</p>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
