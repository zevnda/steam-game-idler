import type { TradingCard } from '@/shared/types'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbLock, TbLockOpen } from 'react-icons/tb'
import { Checkbox, cn, Spinner } from '@heroui/react'
import Image from 'next/image'
import { PageHeader } from '@/features/inventory-manager/components/PageHeader'
import { PriceData } from '@/features/inventory-manager/components/PriceData'
import { PriceInput } from '@/features/inventory-manager/components/PriceInput'
import { useTradingCardsList } from '@/features/inventory-manager/hooks/useTradingCardsList'
import { CustomTooltip } from '@/shared/components/CustomTooltip'
import { ExtLink } from '@/shared/components/ExtLink'
import { useUiStore, useUserStore } from '@/shared/stores'
import { hasGamerFeature } from '@/shared/utils'

export function TradingCardsList() {
  const { t } = useTranslation()
  const tradingCardQuery = useUiStore(s => s.tradingCardQuery)
  const sidebarCollapsed = useUiStore(s => s.sidebarCollapsed)
  const transitionDuration = useUiStore(s => s.transitionDuration)
  const userSettings = useUserStore(s => s.userSettings)
  const proTier = useUserStore(s => s.proTier)
  const [lockedCards, setLockedCards] = useState<string[]>([])
  const [cardFilterValues, setCardFilterValues] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const ctx = useTradingCardsList()

  const CARDS_PER_PAGE = 54

  useEffect(() => setCurrentPage(1), [ctx.cardSortStyle, cardFilterValues])

  useEffect(() => {
    const stored = localStorage.getItem('lockedTradingCards')
    if (stored) setLockedCards(JSON.parse(stored))
  }, [])

  const handleLockCard = (id: string) => {
    setLockedCards(prev => {
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      localStorage.setItem('lockedTradingCards', JSON.stringify(next))
      return next
    })
  }

  const filteredList = useMemo(() => {
    let list = ctx.tradingCardsList
    if (tradingCardQuery)
      list = list.filter(
        c =>
          c.full_name.toLowerCase().includes(tradingCardQuery.toLowerCase()) ||
          c.appname.toLowerCase().includes(tradingCardQuery.toLowerCase()),
      )
    if (!cardFilterValues.has('locked')) list = list.filter(c => !lockedCards.includes(c.id))

    if (cardFilterValues.size === 0) return list

    const filtered = []
    const seen = new Set<string>()

    for (const card of list) {
      let include = true

      if (cardFilterValues.has('cards') && card.item_type !== 'card') include = false
      if (cardFilterValues.has('foil') && !card.foil) include = false
      if (cardFilterValues.has('dupes')) {
        const key = `${card.appid}_${card.market_hash_name}`
        if (seen.has(key)) {
          filtered.push(card)
          continue
        }
        seen.add(key)
        include = false
      }

      if (include) filtered.push(card)
    }

    return cardFilterValues.has('dupes')
      ? filtered
      : list.filter(c => {
          if (cardFilterValues.has('cards') && c.item_type !== 'card') return false
          if (cardFilterValues.has('foil') && !c.foil) return false
          return true
        })
  }, [ctx.tradingCardsList, tradingCardQuery, lockedCards, cardFilterValues])

  const totalPages = Math.ceil(filteredList.length / CARDS_PER_PAGE)
  const paginated = filteredList.slice(
    (currentPage - 1) * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE,
  )

  return (
    <div
      className={cn(
        'min-h-calc max-h-calc overflow-y-auto overflow-x-hidden mt-12 ease-in-out',
        sidebarCollapsed ? 'w-[calc(100vw-56px)]' : 'w-[calc(100vw-250px)]',
      )}
      style={{ transitionDuration, transitionProperty: 'width' }}
    >
      <PageHeader
        ctx={ctx}
        filteredList={filteredList}
        cardFilterValues={cardFilterValues}
        setCardFilterValues={setCardFilterValues}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      {ctx.isLoading ? (
        <div className='flex justify-center items-center h-[calc(100vh-200px)]'>
          <Spinner variant='simple' />
        </div>
      ) : filteredList.length === 0 ? (
        <div className='flex justify-center items-center h-[calc(100vh-200px)]'>
          <p className='text-altwhite'>{t('tradingCards.subtitle')}</p>
        </div>
      ) : (
        <div className='grid grid-cols-6 gap-4 px-6 pb-6'>
          {paginated.map(card => (
            <TradingCardItem
              key={card.id}
              card={card}
              ctx={ctx}
              isLocked={lockedCards.includes(card.id)}
              onLockToggle={handleLockCard}
              isSelected={ctx.selectedCards[card.id] || false}
              onSelectToggle={() =>
                ctx.setSelectedCards(prev => ({ ...prev, [card.id]: !prev[card.id] }))
              }
              isPro={hasGamerFeature(proTier)}
              priceAdjustment={userSettings.tradingCards.priceAdjustment}
              sellOptions={userSettings.tradingCards.sellOptions}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TradingCardItem({
  card,
  ctx,
  isLocked,
  onLockToggle,
  isSelected,
  onSelectToggle,
  isPro,
  priceAdjustment,
  sellOptions,
}: {
  card: TradingCard
  ctx: ReturnType<typeof useTradingCardsList>
  isLocked: boolean
  onLockToggle: (id: string) => void
  isSelected: boolean
  onSelectToggle: () => void
  isPro: boolean
  priceAdjustment: number
  sellOptions: string
}) {
  const { t } = useTranslation()
  const isLoadingPrice = ctx.loadingItemPrice[card.id]

  const basePrice =
    sellOptions === 'highestBuyOrder'
      ? Number(card.price_data?.highest_buy_order || 0) / 100
      : Number(card.price_data?.lowest_sell_order || 0) / 100

  const adjustedPrice =
    ctx.changedCardPrices[card.id] !== undefined
      ? ctx.changedCardPrices[card.id]
      : basePrice + priceAdjustment

  return (
    <div
      className={cn(
        'relative group flex flex-col gap-2 bg-card rounded-xl p-3 border border-border/30 hover:border-border duration-150',
        isLocked && 'opacity-50',
      )}
    >
      <div className='relative'>
        <ExtLink href={card.href}>
          <Image
            src={card.image}
            alt={card.full_name}
            width={200}
            height={200}
            className='w-full object-cover rounded-lg'
            onError={e => {
              ;(e.target as HTMLImageElement).src = '/fallback.webp'
            }}
          />
        </ExtLink>
        {isPro && (
          <div className='absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
            <Checkbox
              size='sm'
              isSelected={isSelected}
              onValueChange={onSelectToggle}
              classNames={{ wrapper: cn('group-data-[selected=true]:!bg-dynamic') }}
            />
          </div>
        )}
        <CustomTooltip content={isLocked ? t('tradingCards.lockCard') : t('tradingCards.lockCard')}>
          <div
            className='absolute top-1 right-1 cursor-pointer bg-black/50 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150'
            onClick={() => onLockToggle(card.id)}
          >
            {isLocked ? <TbLockOpen size={14} /> : <TbLock size={14} />}
          </div>
        </CustomTooltip>
      </div>

      <div className='flex flex-col gap-1 min-w-0'>
        <p className='text-xs font-semibold truncate'>{card.full_name}</p>
        <p className='text-[10px] text-altwhite truncate'>{card.appname}</p>
      </div>

      {card.price_data && <PriceData card={card} />}

      <PriceInput
        card={card}
        adjustedPrice={adjustedPrice}
        isLoadingPrice={isLoadingPrice || false}
        onFetchPrice={() => ctx.handleFetchCardPrice(card)}
        onPriceChange={val => ctx.setChangedCardPrices(prev => ({ ...prev, [card.id]: val }))}
        isPro={isPro}
      />
    </div>
  )
}
