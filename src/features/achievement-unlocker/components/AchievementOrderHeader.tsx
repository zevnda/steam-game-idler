import { useTranslation } from 'react-i18next'
import { TbUsers, TbX } from 'react-icons/tb'
import { Alert, Button, cn, Typography } from '@heroui/react'
import { TierBadge } from '@/shared/components/TierBadge'

interface AchievementOrderHeaderProps {
  name: string
  isDisabled: boolean
  canImportTimings: boolean
  hasProtectedAchievements: boolean
  onClose: () => void
  onImportTimings: () => void
  onUpsell: () => void
}

// Static/fixed header for the achievement-order overlay - mirrors AchievementManagerHeader.tsx's
// header/body split (bg-background, border-b, shrink-0, close-then-title on the left) so import
// stays reachable while the virtualized timeline scrolls beneath them. The
// delay-before-first-unlock wait lives at the top of the timeline itself (AchievementOrderList.tsx's
// StartRow), not here. Import timings is a card in the title row rather than a small toolbar button:
// users repeatedly couldn't find it as a button, and as a card it can say what it does. The
// protected-achievements alert mirrors AchievementManagerHeader.tsx's own, with unlocker-specific
// wording - see useAchievementOrder.ts's `hasProtectedAchievements` for why it disqualifies the
// whole game.
export const AchievementOrderHeader = ({
  name,
  isDisabled,
  canImportTimings,
  hasProtectedAchievements,
  onClose,
  onImportTimings,
  onUpsell,
}: AchievementOrderHeaderProps) => {
  const { t } = useTranslation()

  return (
    // `data-tauri-drag-region` throughout - this overlay is also a `Modal.Container size='cover'`
    // (see AchievementOrderOverlay.tsx), which paints over Titlebar just like
    // AchievementManagerHeader.tsx's does; see that file's doc comment for the full explanation.
    <div
      className='bg-background relative z-10 flex shrink-0 flex-col gap-3 border-b border-border px-6 py-3'
      data-tauri-drag-region
    >
      <div className='flex items-center justify-between gap-4' data-tauri-drag-region>
        <div className='flex min-w-0 items-center gap-2' data-tauri-drag-region>
          <Button isIconOnly variant='ghost' onPress={onClose}>
            <TbX fontSize={18} />
          </Button>
          <div className='flex min-w-0 flex-col' data-tauri-drag-region>
            <Typography className='max-w-100 truncate' data-tauri-drag-region type='h3'>
              {name}
            </Typography>
            <Typography color='muted' data-tauri-drag-region type='body-xs'>
              {t('common.gameCardMenu.customOrder')}
            </Typography>
          </div>
        </div>

        {/* The whole card is the button. Sits in the title row's right side (where Reset used to
            be, before it moved next to Save) - capped in width so a long locale's description
            wraps inside the card instead of squeezing the game name. Plain spans inside rather
            than Typography, which can render block elements a <button> can't contain.
            Gated: stays a real, enabled button (never native `disabled` - a real click on a
            native-disabled control fires no event at all, so the upsell would never open), with
            the press rerouted to the upsell regardless of `isDisabled` (loading/error/empty),
            since opening the upsell modal isn't an edit. Native `disabled` is only used for that
            genuine nothing-loaded-yet state on an account that does have access. */}
        <button
          className={cn(
            'flex min-w-0 max-w-160 items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2 text-left outline-none duration-150',
            'focus-visible:ring-2 focus-visible:ring-focus',
            'enabled:cursor-pointer enabled:hover:border-accent/50 enabled:hover:bg-surface-hover',
            'disabled:opacity-50',
          )}
          disabled={canImportTimings && isDisabled}
          type='button'
          onClick={canImportTimings ? onImportTimings : onUpsell}
        >
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent',
              !canImportTimings && 'opacity-60',
            )}
          >
            <TbUsers fontSize={18} />
          </span>
          <span className='flex min-w-0 flex-1 flex-col'>
            <span className='flex flex-wrap items-center gap-2'>
              <span className='text-sm font-semibold text-foreground'>
                {t('dashboard.achievementUnlocker.importTimings.cardTitle')}
              </span>
              {!canImportTimings && <TierBadge tier='gamer' />}
            </span>
            <span className='text-xs text-muted'>
              {/* A shorter line than the modal's own `importTimings.description` - the card only
                  needs to say what it does; the modal it opens explains the rest. */}
              {t('dashboard.achievementUnlocker.importTimings.cardDescription')}
            </span>
          </span>
        </button>
      </div>

      {hasProtectedAchievements && (
        <Alert status='warning'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('dashboard.achievements.protectedAlert.title')}</Alert.Title>
            <Alert.Description>
              {t('dashboard.achievementUnlocker.order.protectedAlert.description')}
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </div>
  )
}
