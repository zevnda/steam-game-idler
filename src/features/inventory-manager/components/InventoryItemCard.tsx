import type { TranslationKey } from '@/i18n'
import type { InventoryItem } from '../types'
import { useTranslation } from 'react-i18next'
import { SiExpertsexchange } from 'react-icons/si'
import { TbAward, TbChartLine, TbLock, TbLockOpen } from 'react-icons/tb'
import { getCurrencyNumberFormatOptions, getCurrencyStep } from '../utils/currency'
import { Button, Checkbox, cn, Spinner } from '@heroui/react'
import Image from 'next/image'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { InputField } from '@/shared/components/InputField'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { openExternalLink } from '@/shared/utils/links'

// Steam's `item_class_N` tag -> the type chip on each card, reusing the filter panel's labels for
// the same classes (InventoryManagerPage.tsx's filter map) so a chip always matches the filter
// that would show it. Anything else (a class this list doesn't name) gets no chip rather than a
// wrong one.
const ITEM_TYPE_LABEL_KEYS: Record<string, TranslationKey> = {
  item_class_2: 'dashboard.inventoryManager.filter.cards',
  item_class_3: 'dashboard.inventoryManager.filter.backgrounds',
  item_class_4: 'dashboard.inventoryManager.filter.emoticons',
  item_class_5: 'dashboard.inventoryManager.filter.boosters',
  item_class_10: 'dashboard.inventoryManager.filter.sale',
}

// The footer's fixed content height, shared by its two states (price controls / locked notice) -
// the virtualized grid gives every card one measured height (see InventoryItemGrid.tsx's
// measurer, which renders the first item's card), so a footer that changed height with its state
// would overflow or leave gaps in the other cards. 28px price button + 8px gap + 40px price row.
const FOOTER_HEIGHT_CLASS = 'h-19'

interface InventoryItemCardProps {
  item: InventoryItem
  currency: string
  isLocked: boolean
  isSelected: boolean
  priceValue: number
  isFetchingPrice: boolean
  isListing: boolean
  // Any bulk market action (list selected/list all/list dupes/remove listings) in flight -
  // disables this card's own "list single" button even when it's not itself the one listing (its
  // `isPending` spinner stays tied to `isListing` alone) - see InventoryPageHeader.tsx's `isBusy`
  // doc comment for why per-action flags alone don't prevent an overlapping click.
  isBusy: boolean
  onToggleLock: () => void
  onToggleSelect: () => void
  onPriceChange: (value: number) => void
  onListSingle: () => void
  onOpenPriceModal: () => void
}

// One inventory item, in two parts: the item itself (image beside its name, game and type/foil
// chips, with select / SteamCardExchange / lock along the top) and a darker price footer. The
// footer reads top to bottom: "Get market price" (PriceOrderModal, where clicking an order fills the
// price), then the price field and List - instead of the old "Fetch price" link sitting below the
// field it fills. A locked item swaps the footer for a notice
// instead of fading the whole card, so the lock itself stays readable. See globals.css's
// `.holo-card` doc comment for the foil look.
export const InventoryItemCard = ({
  item,
  currency,
  isLocked,
  isSelected,
  priceValue,
  isFetchingPrice,
  isListing,
  isBusy,
  onToggleLock,
  onToggleSelect,
  onPriceChange,
  onListSingle,
  onOpenPriceModal,
}: InventoryItemCardProps) => {
  const { t } = useTranslation()
  const isTradingCard = item.itemType === 'item_class_2'
  const typeLabelKey = ITEM_TYPE_LABEL_KEYS[item.itemType]
  const hasBadge = isTradingCard && item.badgeLevel > 0
  const isChecked = !isLocked && isSelected
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true

  const iconButtonClass =
    'flex size-7 cursor-pointer items-center justify-center rounded-full text-muted outline-none duration-150 hover:bg-surface-hover hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus'

  return (
    // The outer box only exists to stack a foil card's glow (a sibling, see globals.css's
    // `.holo-glow`) behind the card itself.
    <div className='relative h-full'>
      {item.foil && (
        <span
          aria-hidden='true'
          className={cn('holo-glow rounded-xl', forceReducedMotion && 'force-reduced-motion')}
        />
      )}
      <div
        className={cn(
          'relative flex h-full flex-col rounded-xl bg-surface',
          item.foil ? 'holo-card' : 'border border-border',
          item.foil && forceReducedMotion && 'force-reduced-motion',
          // A ring, not a border colour - `.holo-card`'s border is its turning rainbow. Inset, since
          // the grid clips anything drawn outside a cell, so an outer ring lost its top edge on the
          // first row (under the toolbar) and its sides at the grid's edges.
          isChecked && 'ring-2 ring-accent ring-inset',
        )}
      >
        <div className='flex items-center gap-1 px-3 pt-3'>
          <Checkbox isDisabled={isLocked} isSelected={isChecked} onChange={onToggleSelect}>
            <Checkbox.Content>
              <Checkbox.Control className='bg-field hover:bg-field-hover text-foreground'>
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox.Content>
          </Checkbox>

          {/* Wrapped so they sit on the right - a margin on the buttons themselves doesn't reach
            this row, since each one is nested inside its tooltip trigger. */}
          <div className='ml-auto flex items-center gap-1'>
            <AppTooltip.Root>
              <AppTooltip.Trigger>
                <button
                  aria-label={t('dashboard.inventoryManager.actions.cardExchange')}
                  className={iconButtonClass}
                  type='button'
                  onClick={() =>
                    openExternalLink(
                      `https://www.steamcardexchange.net/index.php?gamepage-appid-${item.appId}`,
                    )
                  }
                >
                  <SiExpertsexchange fontSize={12} />
                </button>
              </AppTooltip.Trigger>
              <AppTooltip.Content>
                {t('dashboard.inventoryManager.actions.cardExchange')}
              </AppTooltip.Content>
            </AppTooltip.Root>

            <AppTooltip.Root>
              <AppTooltip.Trigger>
                <button
                  aria-label={t('dashboard.inventoryManager.actions.lockItem')}
                  aria-pressed={isLocked}
                  className={cn(iconButtonClass, isLocked && 'bg-warning/15 text-warning')}
                  type='button'
                  onClick={onToggleLock}
                >
                  {isLocked ? <TbLock fontSize={14} /> : <TbLockOpen fontSize={14} />}
                </button>
              </AppTooltip.Trigger>
              <AppTooltip.Content>
                {t('dashboard.inventoryManager.actions.lockItem')}
              </AppTooltip.Content>
            </AppTooltip.Root>
          </div>
        </div>

        <div className={cn('flex items-center gap-3 px-3 pt-1 pb-3', isLocked && 'opacity-50')}>
          <div className='flex size-24 shrink-0 items-center justify-center'>
            <Image
              alt={item.fullName}
              className='h-full w-full object-contain'
              height={96}
              src={item.image}
              width={96}
            />
          </div>

          <div className='flex min-w-0 flex-1 flex-col gap-1'>
            <span
              className='line-clamp-2 text-[13px] leading-snug font-semibold text-foreground'
              title={item.fullName}
            >
              {item.fullName.replace('(Trading Card)', '').trim()}
            </span>
            <AppTooltip.Root>
              <AppTooltip.Trigger>
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-1 text-xs',
                    hasBadge ? 'text-success' : 'text-muted',
                  )}
                >
                  {/* The award icon is what makes "green = badge crafted" visible without hovering */}
                  {hasBadge && <TbAward className='shrink-0' fontSize={13} />}
                  <span className='truncate'>{item.appName}</span>
                </span>
              </AppTooltip.Trigger>
              {isTradingCard && (
                <AppTooltip.Content>
                  {hasBadge
                    ? t('dashboard.inventoryManager.badgeLevel', { level: item.badgeLevel })
                    : t('dashboard.inventoryManager.noBadge')}
                </AppTooltip.Content>
              )}
            </AppTooltip.Root>
            {(typeLabelKey || item.foil) && (
              <div className='mt-0.5 flex flex-wrap gap-1'>
                {typeLabelKey && (
                  <span className='inline-flex h-5 items-center rounded-full bg-surface-secondary px-2 text-[10px] font-semibold text-muted'>
                    {t(typeLabelKey)}
                  </span>
                )}
                {item.foil && (
                  <span className='inline-flex h-5 items-center rounded-full bg-linear-to-r from-rose-500/60 via-emerald-500/60 to-violet-500/60 px-2 text-[10px] font-semibold text-white'>
                    {t('dashboard.inventoryManager.filter.foil')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='mt-auto rounded-b-xl border-t border-border/70 bg-background/40 p-3'>
          {isLocked ? (
            // The whole notice unlocks - the same action as the lock button above, just with words
            <button
              className={cn(
                'flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg text-center outline-none duration-150 hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-focus',
                FOOTER_HEIGHT_CLASS,
              )}
              type='button'
              onClick={onToggleLock}
            >
              <span className='flex items-center gap-1.5 text-xs font-medium text-warning'>
                <TbLock fontSize={14} />
                {t('dashboard.inventoryManager.filter.locked')}
              </span>
              <span className='text-[11px] text-muted'>
                {t('dashboard.inventoryManager.unlockHint')}
              </span>
            </button>
          ) : (
            <div className={cn('flex flex-col gap-2', FOOTER_HEIGHT_CLASS)}>
              {/* Opens PriceOrderModal - fetching first (with the cooldown) if this item has no
                price yet, otherwise straight onto the already-fetched order book. */}
              <button
                className='flex h-7 w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-border text-[11px] text-muted outline-none duration-150 hover:border-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default disabled:hover:border-border'
                disabled={isFetchingPrice}
                type='button'
                onClick={onOpenPriceModal}
              >
                {isFetchingPrice ? (
                  <Spinner size='sm' />
                ) : (
                  <TbChartLine className='text-accent' fontSize={13} />
                )}
                {isFetchingPrice
                  ? t('dashboard.inventoryManager.fetchingPrice')
                  : t('dashboard.inventoryManager.fetchPrice')}
              </button>

              <div className='flex items-center gap-1.5'>
                <InputField
                  ariaLabel={t('dashboard.inventoryManager.priceLabel')}
                  className='min-w-0 flex-1'
                  commitOnChange
                  formatOptions={getCurrencyNumberFormatOptions(currency)}
                  minValue={0}
                  step={getCurrencyStep(currency)}
                  value={priceValue}
                  onCommit={onPriceChange}
                />
                <Button
                  className='shrink-0'
                  isDisabled={priceValue <= 0 || isBusy}
                  isPending={isListing}
                  onPress={onListSingle}
                >
                  {t('dashboard.inventoryManager.actions.listOne')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
