import type { TradingCard } from '@/types'
import type { ReactElement } from 'react'

import { Alert, Checkbox, cn, Spinner } from '@heroui/react'
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { FaCheckCircle } from 'react-icons/fa'
import { SiExpertsexchange } from 'react-icons/si'
import { TbLock, TbLockOpen } from 'react-icons/tb'

import { useSearchContext } from '@/components/contexts/SearchContext'
import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import PageHeader from '@/components/trading-cards/PageHeader'
import PriceData from '@/components/trading-cards/PriceData'
import PriceInput from '@/components/trading-cards/PriceInput'
import CustomTooltip from '@/components/ui/CustomTooltip'
import ExtLink from '@/components/ui/ExtLink'
import useTradingCardsList from '@/hooks/trading-cards/useTradingCardsList'

export default function TradingCardsList(): ReactElement {
  const { t } = useTranslation()
  const { tradingCardQueryValue } = useSearchContext()
  const { sidebarCollapsed, transitionDuration } = useStateContext()
  const { userSettings } = useUserContext()
  const [lockedCards, setLockedCards] = useState<string[]>([])
  const [cardsPerRow, setCardsPerRow] = useState(6)
  const [currentPage, setCurrentPage] = useState(1)
  const tradingCardContext = useTradingCardsList()

  const CARDS_PER_PAGE = 50

  useEffect(() => {
    const storedLockedCards = localStorage.getItem('lockedTradingCards')
    if (storedLockedCards) {
      setLockedCards(JSON.parse(storedLockedCards))
    }
  }, [])

  useEffect(() => {
    const updateCardsPerRow = (): void => {
      setCardsPerRow(window.innerWidth >= 1536 ? 9 : 6)
    }
    updateCardsPerRow()
    window.addEventListener('resize', updateCardsPerRow)
    return () => window.removeEventListener('resize', updateCardsPerRow)
  }, [])

  const handleLockCard = (id: string): void => {
    setLockedCards(prev => {
      const newLockedCards = prev.includes(id) ? prev.filter(cardId => cardId !== id) : [...prev, id]
      localStorage.setItem('lockedTradingCards', JSON.stringify(newLockedCards))
      return newLockedCards
    })
  }

  const filteredTradingCardsList = useMemo(
    () =>
      tradingCardContext.tradingCardsList.filter(
        card =>
          card.full_name.toLowerCase().includes(tradingCardQueryValue.toLowerCase()) ||
          card.appname.toLowerCase().includes(tradingCardQueryValue.toLowerCase()),
      ),
    [tradingCardContext.tradingCardsList, tradingCardQueryValue],
  )

  const totalPages = Math.ceil(filteredTradingCardsList.length / CARDS_PER_PAGE)

  const paginatedCards = useMemo(
    () => filteredTradingCardsList.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE),
    [filteredTradingCardsList, currentPage],
  )

  const selectedCardsWithPrice = useMemo(
    () =>
      Object.keys(tradingCardContext.selectedCards).filter(
        id => tradingCardContext.selectedCards[id] && tradingCardContext.changedCardPrices[id] > 0,
      ),
    [tradingCardContext.selectedCards, tradingCardContext.changedCardPrices],
  )

  const renderCard = (item: TradingCard): ReactElement | null => {
    if (!item) return null

    const isLocked = lockedCards.includes(item.id)
    const isFoil = item.foil

    return (
      <div
        key={item.assetid}
        className={cn(
          'flex flex-col justify-start items-center bg-sidebar mb-2 rounded-lg border border-border p-2',
          lockedCards.includes(item.id) && 'opacity-50',
          isFoil && 'holo-bg',
        )}
      >
        <div className='relative flex justify-between items-center w-full mb-2'>
          <Checkbox
            size='sm'
            name={item.assetid}
            isSelected={tradingCardContext.selectedCards[item.assetid] || false}
            onChange={() => tradingCardContext.toggleCardSelection(item.assetid)}
            classNames={{
              hiddenInput: 'w-fit',
              wrapper: cn(
                'before:group-data-[selected=true]:!border-dynamic',
                'before:border-altwhite after:bg-dynamic m-0',
              ),
              label: 'hidden',
            }}
          />

          <div className='flex items-center gap-1'>
            <CustomTooltip content={t('tradingCards.lockCard')} placement='top'>
              <div
                className='hover:bg-item-hover rounded-full p-1 cursor-pointer duration-200'
                onClick={() => handleLockCard(item.id)}
              >
                {isLocked ? <TbLock fontSize={14} className='text-yellow-500' /> : <TbLockOpen fontSize={14} />}
              </div>
            </CustomTooltip>

            <CustomTooltip content={t('tradingCards.cardExchange')} placement='top'>
              <div>
                <ExtLink href={`https://www.steamcardexchange.net/index.php?gamepage-appid-${item.appid}`}>
                  <div className='hover:bg-item-hover rounded-full p-1.5 cursor-pointer duration-200'>
                    <SiExpertsexchange fontSize={10} />
                  </div>
                </ExtLink>
              </div>
            </CustomTooltip>
          </div>
        </div>

        <CustomTooltip
          important
          placement='right'
          content={
            <div className='py-2'>
              <Image
                className='w-[150px] h-auto border border-border'
                src={item.image}
                width={224}
                height={261}
                alt={`${item.appname} image`}
                priority={true}
              />
            </div>
          }
        >
          <div className='flex items-center justify-between bg-input rounded-lg p-1.5 border border-border'>
            <Image
              className='w-20 h-auto border border-border'
              src={item.image}
              width={224}
              height={261}
              alt={`${item.appname} image`}
              priority={true}
            />
          </div>
        </CustomTooltip>

        <div className='flex flex-col items-center justify-center gap-0.5 mt-2'>
          <p className='text-xs truncate max-w-[140px]'>{item.full_name.replace('(Trading Card)', '') || 'Unknown'}</p>

          <CustomTooltip
            content={
              item.badge_level > 0
                ? t('tradingCards.badgeLevel', { level: item.badge_level })
                : t('tradingCards.noBadge')
            }
            placement='top'
            important
          >
            <div className='flex items-center justify-center gap-1'>
              {item.badge_level > 0 && (
                <div className='flex items-center justify-center'>
                  <FaCheckCircle size={12} className='text-green-400' />
                </div>
              )}
              <p
                className={cn('text-xs text-altwhite truncate max-w-[140px]', item.badge_level > 0 && 'text-green-400')}
              >
                {item.appname}
              </p>
            </div>
          </CustomTooltip>
        </div>

        <PriceInput item={item} tradingCardContext={tradingCardContext} />

        <PriceData item={item} tradingCardContext={tradingCardContext} />
      </div>
    )
  }

  return (
    <div
      key={tradingCardContext.refreshKey}
      className={cn(
        'min-h-calc max-h-calc overflow-y-auto overflow-x-hidden mt-9 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{
        transitionDuration,
        transitionProperty: 'width',
      }}
    >
      <PageHeader
        selectedCardsWithPrice={selectedCardsWithPrice}
        tradingCardContext={tradingCardContext}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {!userSettings.cardFarming.credentials && (
        <div className='mx-6 max-w-fit'>
          <Alert
            color='primary'
            variant='faded'
            classNames={{
              base: '!bg-dynamic/30 text-dynamic !border-dynamic/40',
              iconWrapper: '!bg-dynamic/30 border-dynamic/40',
              description: 'font-bold text-xs',
            }}
            description={t('settings.tradingCards.alert')}
          />
        </div>
      )}

      {!tradingCardContext.isLoading ? (
        <div className='flex flex-col'>
          <div className={`grid gap-4 px-6 pt-2 ${cardsPerRow === 9 ? 'grid-cols-9' : 'grid-cols-6'}`}>
            {paginatedCards.map(item => renderCard(item))}
          </div>
        </div>
      ) : (
        <div className='flex justify-center items-center w-calc h-[calc(100vh-224px)]'>
          <Spinner variant='simple' />
        </div>
      )}
    </div>
  )
}
