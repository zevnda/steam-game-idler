import { useTranslation } from 'react-i18next'
import { TbX } from 'react-icons/tb'
import { Button, Typography } from '@heroui/react'

interface AchievementOrderHeaderProps {
  name: string
  isDisabled: boolean
  canImportTimings: boolean
  onClose: () => void
  onReset: () => void
  onImportTimings: () => void
  onUpsell: () => void
}

// Static/fixed header for the achievement-order overlay - mirrors AchievementManagerHeader.tsx's
// header/body split (bg-overlay, border-b, shrink-0, close-then-title on the left) so the reset and
// import controls stay reachable while the virtualized achievement list scrolls beneath them,
// instead of scrolling away with it like the previous inline row did. The delay-before-first-unlock
// input lives in AchievementOrderListHeader.tsx instead, above the list, so it lines up with each
// row's own per-achievement delay input.
export const AchievementOrderHeader = ({
  name,
  isDisabled,
  canImportTimings,
  onClose,
  onReset,
  onImportTimings,
  onUpsell,
}: AchievementOrderHeaderProps) => {
  const { t } = useTranslation()

  return (
    // `data-tauri-drag-region` throughout - this overlay is also a `Modal.Container size='cover'`
    // (see AchievementOrderOverlay.tsx), which paints over Titlebar just like
    // AchievementManagerHeader.tsx's does; see that file's doc comment for the full explanation.
    <div
      className='bg-overlay relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-border px-6 py-3'
      data-tauri-drag-region
    >
      <div className='flex min-w-0 items-center gap-2' data-tauri-drag-region>
        <Button isIconOnly aria-label='Close' variant='ghost' onPress={onClose}>
          <TbX fontSize={18} />
        </Button>
        <Typography className='max-w-65 truncate' data-tauri-drag-region type='h3'>
          {name}
        </Typography>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        <Button isDisabled={isDisabled} size='sm' variant='danger' onPress={onReset}>
          {t('dashboard.achievementUnlocker.order.reset')}
        </Button>
        {canImportTimings ? (
          <Button isDisabled={isDisabled} size='sm' variant='secondary' onPress={onImportTimings}>
            {t('dashboard.achievementUnlocker.importTimings.title')}
          </Button>
        ) : (
          // Not `isDisabled` on the Button - HeroUI maps that to a native `disabled` attribute,
          // which swallows the real click a gated upsell needs entirely (confirmed live via CDP).
          // The wrapping span only supplies the native hover tooltip; the Button itself stays real
          // and pressable, styled to look disabled, with `onPress` opening the upsell - regardless
          // of `isDisabled` (loading/error/empty), since opening the upsell modal isn't an edit.
          <span className='inline-flex' title={t('common.proTier.gamerRequired')}>
            <Button className='opacity-50' size='sm' variant='secondary' onPress={onUpsell}>
              {t('dashboard.achievementUnlocker.importTimings.title')}
            </Button>
          </span>
        )}
      </div>
    </div>
  )
}
