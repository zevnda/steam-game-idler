import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TbRefresh, TbSettings } from 'react-icons/tb'
import { AlertDialog, Button, cn, Typography } from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { formatDuration } from '@/shared/utils/formatDuration'
import { hasGamerAccess } from '@/shared/utils/subscriptionAccess'

// Matches src-tauri/src/inventory/market.rs::remove_market_listings' fixed 1000ms delay between
// each listing cancellation - unlike listing/selling, this isn't a configurable sellDelay setting.
const REMOVE_LISTING_DELAY_SECONDS = 1

interface InventoryPageHeaderProps {
  itemCount: number
  selectedCount: number
  dupesCount: number
  // This account's inventory-manager `sellDelay` setting (seconds between each listing request the
  // backend makes - src-tauri/src/inventory/market.rs::list_items) - used only to estimate how long
  // a bulk action will take in the confirm dialogs below, not to drive any actual delay here.
  sellDelaySeconds: number
  // Gates the action buttons/pagination row - `false` before the account's inventory has been
  // fetched at least once this page visit (still initializing, or the connect panel is showing).
  // The title/count row itself always renders (see InventoryManagerPage's own doc comment on why -
  // every other page's header mounts unconditionally too).
  hasLoaded: boolean
  isFetching: boolean
  isListing: boolean
  isSellingAll: boolean
  isSellingDupes: boolean
  isRemovingListings: boolean
  // `isListing || isSellingAll || isSellingDupes || isRemovingListings`, computed once by
  // InventoryManagerPage (also passed to InventoryItemGrid) rather than re-derived here, so both
  // consumers agree on what "busy" means.
  isBusy: boolean
  onRefresh: () => void
  onOpenSettings: () => void
  onListSelected: () => void
  onSellAll: () => void
  onSellDupes: () => void
  onRemoveListings: () => void
}

// Small pill badge - matches Sidebar.tsx's tier pill / AchievementUnlockerSettingsTab's inline
// "Gamer" tag styling rather than introducing HeroUI's `Chip` for a first, unproven use.
const Badge = ({ children, tone }: { children: React.ReactNode; tone?: 'gamer' }) => (
  <span
    className={cn(
      'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
      tone === 'gamer' ? 'bg-purple-500/20 text-purple-400' : 'bg-surface-hover text-foreground',
    )}
  >
    {children}
  </span>
)

// Title/count, bulk actions (list selected / sell all / sell dupes / remove listings), a
// refresh button, and the settings-gear shortcut - mirrors `main`'s PageHeader scope minus
// pagination (InventoryItemGrid is now virtualized - a single scrolling view, no per-page split),
// with HeroUI v3's `AlertDialog` replacing `main`'s `CustomModal`-based confirmations (same
// component Sidebar's sign-out confirm already established). "Sell dupes" is the one gamer-tier
// gate here - enforced only at this call site, no Rust-side check.
export const InventoryPageHeader = ({
  itemCount,
  selectedCount,
  dupesCount,
  sellDelaySeconds,
  hasLoaded,
  isFetching,
  isListing,
  isSellingAll,
  isSellingDupes,
  isRemovingListings,
  isBusy,
  onRefresh,
  onOpenSettings,
  onListSelected,
  onSellAll,
  onSellDupes,
  onRemoveListings,
}: InventoryPageHeaderProps) => {
  const { t } = useTranslation()
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const canSellDupes = hasGamerAccess(subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)

  const [openDialog, setOpenDialog] = useState<
    'listSelected' | 'sellAll' | 'sellDupes' | 'removeListings' | null
  >(null)
  const closeDialog = () => setOpenDialog(null)

  return (
    <div className='flex shrink-0 flex-col gap-3 px-6 py-2'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex flex-col'>
          <Typography type='h2' className='font-black'>
            {t('dashboard.sidebar.nav.inventoryManager')}
          </Typography>
          <Typography color='muted' type='body-sm'>
            {hasLoaded
              ? t('dashboard.inventoryManager.count', { count: itemCount })
              : t('dashboard.inventoryManager.connect.description')}
          </Typography>
        </div>

        <div className='flex flex-wrap items-center justify-end gap-2'>
          {hasLoaded && (
            <>
              <AppTooltip.Root>
                <AppTooltip.Trigger>
                  <Button
                    isIconOnly
                    aria-label={t('common.actions.refresh')}
                    isPending={isFetching}
                    variant='secondary'
                    onPress={onRefresh}
                  >
                    <TbRefresh fontSize={18} />
                  </Button>
                </AppTooltip.Trigger>
                <AppTooltip.Content>{t('common.actions.refresh')}</AppTooltip.Content>
              </AppTooltip.Root>

              <Button
                isDisabled={selectedCount === 0 || isBusy}
                isPending={isListing}
                variant='secondary'
                onPress={() => setOpenDialog('listSelected')}
              >
                {t('dashboard.inventoryManager.actions.listSelected', { count: selectedCount })}
              </Button>

              <Button
                isDisabled={itemCount === 0 || isBusy}
                isPending={isSellingAll}
                variant='secondary'
                onPress={() => setOpenDialog('sellAll')}
              >
                {t('dashboard.inventoryManager.actions.sellAll', { count: itemCount })}
              </Button>

              <AppTooltip.Root>
                <AppTooltip.Trigger>
                  {/* `isDisabled` only reflects the real "nothing to sell" reason (itemCount === 0)
                      - a gamer-tier gate is styled to look disabled but stays a real, pressable
                      Button whose `onPress` opens the upsell instead. HeroUI's Button maps
                      `isDisabled` to a native `disabled` attribute, which would otherwise swallow
                      the real click a gated upsell needs entirely (confirmed live via CDP), not
                      just block bubbling to a wrapper. */}
                  <Button
                    className={!canSellDupes ? 'opacity-50' : undefined}
                    isDisabled={itemCount === 0 || isBusy}
                    isPending={isSellingDupes}
                    variant='secondary'
                    onPress={() =>
                      canSellDupes ? setOpenDialog('sellDupes') : openProModalWithTier('gamer')
                    }
                  >
                    {t('dashboard.inventoryManager.actions.sellDupes')}
                    {!canSellDupes && <Badge tone='gamer'>{t('proMode.tier.gamer.name')}</Badge>}
                  </Button>
                </AppTooltip.Trigger>
                {!canSellDupes && (
                  <AppTooltip.Content>
                    {t('dashboard.inventoryManager.actions.sellDupesGamerRequired')}
                  </AppTooltip.Content>
                )}
              </AppTooltip.Root>

              <Button
                isDisabled={itemCount === 0 || isBusy}
                isPending={isRemovingListings}
                variant='danger'
                onPress={() => setOpenDialog('removeListings')}
              >
                {t('dashboard.inventoryManager.actions.removeListings')}
              </Button>
            </>
          )}

          <AppTooltip.Root>
            <AppTooltip.Trigger>
              <Button isIconOnly aria-label={t('common.actions.settings')} onPress={onOpenSettings}>
                <TbSettings fontSize={18} />
              </Button>
            </AppTooltip.Trigger>
            <AppTooltip.Content>{t('common.actions.settings')}</AppTooltip.Content>
          </AppTooltip.Root>
        </div>
      </div>

      <AlertDialog
        isOpen={openDialog === 'listSelected'}
        onOpenChange={open => !open && closeDialog()}
      >
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.inventoryManager.confirm.listSelected.title', {
                    count: selectedCount,
                  })}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t('dashboard.inventoryManager.confirm.listSelected.description', {
                  count: selectedCount,
                  time: formatDuration(selectedCount * sellDelaySeconds),
                })}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant='secondary' onPress={closeDialog}>
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  onPress={() => {
                    onListSelected()
                    closeDialog()
                  }}
                >
                  {t('common.actions.submit')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <AlertDialog isOpen={openDialog === 'sellAll'} onOpenChange={open => !open && closeDialog()}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.inventoryManager.confirm.sellAll.title')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t('dashboard.inventoryManager.confirm.sellAll.description', {
                  count: itemCount,
                  time: formatDuration(itemCount * sellDelaySeconds),
                })}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant='secondary' onPress={closeDialog}>
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  onPress={() => {
                    onSellAll()
                    closeDialog()
                  }}
                >
                  {t('common.actions.submit')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <AlertDialog
        isOpen={openDialog === 'sellDupes'}
        onOpenChange={open => !open && closeDialog()}
      >
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.inventoryManager.confirm.sellDupes.title')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t('dashboard.inventoryManager.confirm.sellDupes.description', {
                  count: dupesCount,
                  time: formatDuration(dupesCount * sellDelaySeconds),
                })}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant='secondary' onPress={closeDialog}>
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  onPress={() => {
                    onSellDupes()
                    closeDialog()
                  }}
                >
                  {t('common.actions.submit')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <AlertDialog
        isOpen={openDialog === 'removeListings'}
        onOpenChange={open => !open && closeDialog()}
      >
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.inventoryManager.confirm.removeListings.title')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t('dashboard.inventoryManager.confirm.removeListings.description', {
                  time: formatDuration(itemCount * REMOVE_LISTING_DELAY_SECONDS),
                })}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant='secondary' onPress={closeDialog}>
                  {t('common.actions.cancel')}
                </Button>
                <Button
                  variant='danger'
                  onPress={() => {
                    onRemoveListings()
                    closeDialog()
                  }}
                >
                  {t('dashboard.inventoryManager.actions.removeListings')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  )
}
