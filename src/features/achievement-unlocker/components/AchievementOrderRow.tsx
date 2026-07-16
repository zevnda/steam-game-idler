import type { OrderableAchievement } from '../hooks/useAchievementOrder'
import { useTranslation } from 'react-i18next'
import { GoGrabber } from 'react-icons/go'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Checkbox, cn, NumberField, Typography } from '@heroui/react'
import Image from 'next/image'
import {
  getAchievementRarityTier,
  RARITY_TIER_CLASSES,
  RARITY_TIER_LABEL_KEYS,
} from '@/features/achievement-manager/utils/achievementRarity'

const ICON_BASE_URL = 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/'

// Card treatment mirrors AchievementRow.tsx's row shape (see that file's doc comment for why) -
// the rarity pill even reuses the exact same util, since this editor's rows are still real
// AchievementDto data (OrderableAchievement extends it) with the same `percent` field, and the
// description line below the name mirrors AchievementRow.tsx's own treatment too. Keep
// AchievementOrderList.tsx's ROW_HEIGHT in sync with this row's actual rendered height.
const ROW_GRID = 'grid-cols-[28px_44px_1fr_auto_28px]'

interface AchievementOrderRowProps {
  appId: number
  achievement: OrderableAchievement
  isOverlay?: boolean
  onToggleSkip: (id: string) => void
  onSetDelay: (id: string, value: number | null) => void
}

// One draggable row in the achievement-order editor - checkbox (include/skip), icon, name +
// unlock percent, a per-achievement delay-until-next-unlock input, and a drag handle. Mirrors
// `main`'s AchievementOrderPage.tsx SortableAchievement, minus the react-window virtualization (see
// Step 15's own "no virtualized list" note - same small-count reasoning applies here) and keyed by
// `id` instead of the display `name` (order.rs's own stable key, see its doc comment).
export const AchievementOrderRow = ({
  appId,
  achievement,
  isOverlay = false,
  onToggleSkip,
  onSetDelay,
}: AchievementOrderRowProps) => {
  const { t } = useTranslation()
  const sortable = useSortable({ id: achievement.id, disabled: isOverlay })
  const icon = `${ICON_BASE_URL}${appId}/${achievement.iconLocked}`
  const rarityTier =
    achievement.percent !== undefined ? getAchievementRarityTier(achievement.percent) : null

  // React Aria's NumberField represents an empty field as `NaN` (both as the `value` it renders
  // and the `value` its `onChange` fires with) rather than an empty string - `delayNextUnlock`'s
  // own "unset" sentinel is `undefined`/`null`, so this converts at the boundary each way instead
  // of changing that contract.
  const handleDelayChange = (value: number) => {
    onSetDelay(achievement.id, Number.isNaN(value) ? null : value)
  }

  return (
    <div
      ref={isOverlay ? undefined : sortable.setNodeRef}
      className={cn(
        'grid items-center gap-3 rounded-xl border px-3 py-2.5 bg-surface',
        ROW_GRID,
        'duration-150',
        // De-emphasis for a skipped row comes from a solid, quieter card background rather than
        // `opacity` - same reasoning as AchievementRow.tsx's own de-emphasis treatment, so the
        // checkbox/delay input/name stay fully legible instead of visually fading along with it.
        achievement.skip ? 'border-border/60' : 'border-border',
        !isOverlay && 'hover:border-accent/50',
        !isOverlay && sortable.isDragging && 'opacity-0',
        isOverlay && 'border-accent shadow-xl ring-2 ring-accent/30',
      )}
      style={
        isOverlay
          ? undefined
          : {
              transform: CSS.Transform.toString(sortable.transform),
              transition: sortable.transition,
            }
      }
    >
      <div className='flex items-center justify-center'>
        <Checkbox isSelected={!achievement.skip} onChange={() => onToggleSkip(achievement.id)}>
          <Checkbox.Content>
            <Checkbox.Control className='bg-surface-tertiary hover:bg-surface-hover text-foreground'>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      </div>

      <Image
        alt=''
        className='rounded-lg ring-2 ring-border/50'
        height={44}
        src={icon}
        width={44}
      />

      <div className='flex min-w-0 flex-col'>
        <div className='flex items-baseline gap-2 min-w-0'>
          <Typography
            truncate
            color={achievement.skip ? 'muted' : undefined}
            type='body-sm'
            weight='semibold'
          >
            {achievement.name}
          </Typography>
          {achievement.skip && (
            <span className='shrink-0 rounded-full bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-semibold text-muted'>
              {t('dashboard.achievementUnlocker.order.skipped')}
            </span>
          )}
          {rarityTier && (
            <span
              className={cn(
                'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap',
                RARITY_TIER_CLASSES[rarityTier],
              )}
            >
              {achievement.percent!.toFixed(1)}% • {t(RARITY_TIER_LABEL_KEYS[rarityTier])}
            </span>
          )}
        </div>
        {/* AchievementRow.tsx's equivalent blur condition also checks `!achievement.achieved` -
            omitted here since useAchievementOrder.ts's `load` only ever populates this list from
            already-unlocked-filtered achievements, so `achieved` is always false for every row. */}
        <Typography
          className={cn('truncate', achievement.hidden && 'blur-xs hover:blur-none')}
          color='muted'
          type='body-xs'
        >
          {achievement.description || t('dashboard.achievements.noDescription')}
        </Typography>
      </div>

      <div className='flex shrink-0 items-center gap-1.5'>
        <NumberField
          aria-label={`Unlock delay for ${achievement.name}`}
          className='w-35'
          formatOptions={{ maximumFractionDigits: 1, useGrouping: false }}
          isDisabled={achievement.skip}
          minValue={0}
          step={0.1}
          value={achievement.delayNextUnlock ?? NaN}
          onChange={handleDelayChange}
        >
          <NumberField.Group className='bg-surface-secondary hover:bg-surface-hover text-foreground'>
            <NumberField.DecrementButton />
            <NumberField.Input />
            <NumberField.IncrementButton />
          </NumberField.Group>
        </NumberField>
        <Typography color='muted' type='body-xs'>
          {t('common.minutes')}
        </Typography>
      </div>

      {isOverlay ? (
        <span className='justify-self-end rounded-full p-1.5'>
          <GoGrabber className='text-accent' fontSize={22} />
        </span>
      ) : (
        <span
          {...sortable.attributes}
          {...sortable.listeners}
          className='cursor-grab justify-self-end rounded-full p-1.5 duration-150 hover:bg-surface-hover active:cursor-grabbing'
          style={{ touchAction: 'none' }}
        >
          <GoGrabber className='text-muted hover:text-foreground' fontSize={22} />
        </span>
      )}
    </div>
  )
}
