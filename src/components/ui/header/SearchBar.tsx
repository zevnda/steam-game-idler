import type { ChangeEvent, ReactElement } from 'react'

import { cn, Input } from '@heroui/react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useSearchContext } from '@/components/contexts/SearchContext'
import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import useHeader from '@/hooks/ui/useHeader'

export default function SearchBar(): ReactElement {
  const { t } = useTranslation()
  const searchContext = useSearchContext()
  const { showAchievements } = useStateContext()
  const { activePage, currentTab } = useNavigationContext()
  const { achievementsUnavailable, statisticsUnavailable } = useUserContext()

  useHeader()

  const handleGameQueryChange = (e: ChangeEvent<HTMLInputElement>): void => {
    searchContext.setGameQueryValue(e.target.value)
  }

  const handleTradingCardQueryChange = (e: ChangeEvent<HTMLInputElement>): void => {
    searchContext.setTradingCardQueryValue(e.target.value)
  }

  const handleAchievementQueryChange = (e: ChangeEvent<HTMLInputElement>): void => {
    searchContext.setAchievementQueryValue(e.target.value)
  }

  const handleStatisticQueryChange = (e: ChangeEvent<HTMLInputElement>): void => {
    searchContext.setStatisticQueryValue(e.target.value)
  }

  const handleKeyDown = (): void => {
    searchContext.setIsQuery(true)
  }

  return (
    <div className='flex items-center flex-grow py-4 h-full' data-tauri-drag-region>
      {activePage === 'games' && !showAchievements && (
        <Input
          size='sm'
          isClearable
          isDisabled={activePage !== 'games' || showAchievements}
          placeholder={t('search.games')}
          startContent={<RiSearchLine />}
          className='w-[300px] ml-14'
          classNames={{
            inputWrapper: cn(
              'bg-input border border-border hover:!bg-inputhover',
              'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
            ),
            input: ['!text-content placeholder:text-altwhite/50'],
          }}
          value={searchContext.gameQueryValue}
          onChange={handleGameQueryChange}
          onKeyDown={handleKeyDown}
          onClear={() => searchContext.setGameQueryValue('')}
        />
      )}
      {activePage === 'tradingCards' && !showAchievements && (
        <Input
          size='sm'
          isClearable
          isDisabled={activePage !== 'tradingCards' || showAchievements}
          placeholder={t('search.tradingCards')}
          startContent={<RiSearchLine />}
          className='w-[300px] ml-14'
          classNames={{
            inputWrapper: cn(
              'bg-input border border-border hover:!bg-inputhover',
              'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
            ),
            input: ['!text-content placeholder:text-altwhite/50'],
          }}
          value={searchContext.tradingCardQueryValue}
          onChange={handleTradingCardQueryChange}
          onKeyDown={handleKeyDown}
          onClear={() => searchContext.setTradingCardQueryValue('')}
        />
      )}
      {showAchievements && currentTab === 'achievements' && (
        <Input
          size='sm'
          isClearable
          isDisabled={achievementsUnavailable}
          placeholder={t('search.achievements')}
          startContent={<RiSearchLine />}
          className='max-w-[300px] ml-4'
          classNames={{
            inputWrapper: cn(
              'bg-input border border-border hover:!bg-inputhover',
              'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
            ),
            input: ['!text-content placeholder:text-altwhite/50'],
          }}
          value={searchContext.achievementQueryValue}
          onChange={handleAchievementQueryChange}
          onClear={() => searchContext.setAchievementQueryValue('')}
        />
      )}
      {showAchievements && currentTab === 'statistics' && (
        <Input
          size='sm'
          isClearable
          isDisabled={statisticsUnavailable}
          placeholder={t('search.statistics')}
          startContent={<RiSearchLine />}
          className='max-w-[300px] ml-4'
          classNames={{
            inputWrapper: cn(
              'bg-input border border-border hover:!bg-inputhover',
              'rounded-lg group-data-[focus-within=true]:!bg-inputhover',
            ),
            input: ['!text-content placeholder:text-altwhite/50'],
          }}
          value={searchContext.statisticQueryValue}
          onChange={handleStatisticQueryChange}
          onClear={() => searchContext.setStatisticQueryValue('')}
        />
      )}
    </div>
  )
}
