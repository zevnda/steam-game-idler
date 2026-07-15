import type { InventoryItem } from '../types'
import { useTranslation } from 'react-i18next'
import { SiExpertsexchange } from 'react-icons/si'
import { TbArrowRight, TbLock, TbLockOpen, TbPackageExport } from 'react-icons/tb'
import { getCurrencyNumberFormatOptions, getCurrencyStep } from '../utils/currency'
import { Button, Checkbox, cn, Typography } from '@heroui/react'
import Image from 'next/image'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { InputField } from '@/shared/components/InputField'
import { openExternalLink } from '@/shared/utils/links'

interface InventoryItemCardProps {
  item: InventoryItem
  currency: string
  isLocked: boolean
  isSelected: boolean
  priceValue: number
  isFetchingPrice: boolean
  isListing: boolean
  // Any bulk market action (list selected/sell all/sell dupes/remove listings) in flight -
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

// One inventory item - selection checkbox, lock toggle, a SteamCardExchange link, image,
// name/owning-game (with a badge indicator for trading cards), a price input + single-item list
// button, and a "fetch price" trigger that opens PriceOrderModal. Mirrors `main`'s ItemsList.tsx
// card shape, restyled to this rewrite's component conventions - see globals.css's `.holo-card`
// doc comment for how the foil background differs from `main`'s `.holo-bg`.
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

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl bg-surface p-2',
        item.foil ? 'holo-card' : 'border border-border',
        isLocked && 'opacity-50',
      )}
    >
      <div className='mb-2 flex w-full items-center justify-between'>
        <Checkbox
          isDisabled={isLocked}
          isSelected={!isLocked && isSelected}
          onChange={onToggleSelect}
        >
          <Checkbox.Content>
            <Checkbox.Control className='bg-surface-tertiary hover:bg-surface-hover text-foreground'>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>

        <div className='flex items-center gap-0.5'>
          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <button
                className='flex size-6 cursor-pointer items-center justify-center rounded-full duration-150 hover:bg-surface-hover'
                type='button'
                onClick={onToggleLock}
              >
                {isLocked ? (
                  <TbLock className='text-warning' fontSize={14} />
                ) : (
                  <TbLockOpen fontSize={14} />
                )}
              </button>
            </AppTooltip.Trigger>
            <AppTooltip.Content>
              {t('dashboard.inventoryManager.actions.lockItem')}
            </AppTooltip.Content>
          </AppTooltip.Root>

          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <button
                className='flex size-6 cursor-pointer items-center justify-center rounded-full duration-150 hover:bg-surface-hover'
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
        </div>
      </div>

      <div className='flex h-24 w-24 items-center justify-center'>
        <Image
          alt={item.fullName}
          className='h-full w-full object-contain'
          height={96}
          src={item.image}
          width={96}
        />
      </div>

      <div className='mt-2 flex flex-col items-center gap-0.5'>
        <Typography className='max-w-44 truncate' title={item.fullName} type='body-xs'>
          {item.fullName.replace('(Trading Card)', '').trim()}
        </Typography>
        <AppTooltip.Root>
          <AppTooltip.Trigger>
            <span>
              <Typography
                className={cn('max-w-44 truncate', item.badgeLevel > 0 && 'text-success')}
                color={item.badgeLevel > 0 ? undefined : 'muted'}
                type='body-xs'
              >
                {item.appName}
              </Typography>
            </span>
          </AppTooltip.Trigger>
          {isTradingCard && (
            <AppTooltip.Content>
              {item.badgeLevel > 0
                ? t('dashboard.inventoryManager.badgeLevel', { level: item.badgeLevel })
                : t('dashboard.inventoryManager.noBadge')}
            </AppTooltip.Content>
          )}
        </AppTooltip.Root>
      </div>

      <div className='mt-2 flex items-center gap-1'>
        <InputField
          ariaLabel='Item price'
          className='w-32'
          commitOnChange
          formatOptions={getCurrencyNumberFormatOptions(currency)}
          isDisabled={isLocked}
          minValue={0}
          step={getCurrencyStep(currency)}
          value={priceValue}
          onCommit={onPriceChange}
        />

        <AppTooltip.Root>
          <AppTooltip.Trigger>
            <Button
              isIconOnly
              isDisabled={priceValue <= 0 || isBusy}
              isPending={isListing}
              variant='secondary'
              onPress={onListSingle}
            >
              <TbPackageExport fontSize={18} />
            </Button>
          </AppTooltip.Trigger>
          <AppTooltip.Content>{t('dashboard.inventoryManager.actions.list')}</AppTooltip.Content>
        </AppTooltip.Root>
      </div>

      <button
        className={cn(
          'group mt-2 flex items-center gap-1.5 text-xs text-muted duration-150',
          isLocked ? 'opacity-50' : 'cursor-pointer hover:text-foreground',
        )}
        disabled={isLocked || isFetchingPrice}
        type='button'
        onClick={onOpenPriceModal}
      >
        {isFetchingPrice
          ? t('dashboard.inventoryManager.fetchingPrice')
          : t('dashboard.inventoryManager.fetchPrice')}
        <TbArrowRight className='duration-150 group-hover:translate-x-1' />
      </button>
    </div>
  )
}
