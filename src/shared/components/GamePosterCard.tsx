import type { ComponentProps, ReactNode } from 'react'
import { TbCheck } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import { GamePosterArt } from '@/shared/components/GamePosterArt'
import { gameCardContextAttrs } from '@/shared/utils/gameCardContext'

// Collapses to zero height until the card is hovered or something inside it has keyboard focus. The
// content stays mounted and focusable throughout, so keyboard users can still reach the actions.
// `focus-visible`, not `focus-within`: a clicked button keeps focus, which would leave the card stuck
// open after the pointer moves away.
const REVEAL_CLASSNAME =
  'grid grid-rows-[0fr] transition-[grid-template-rows] duration-150 group-has-focus-visible:grid-rows-[1fr] group-hover:grid-rows-[1fr]'

interface GamePosterCardProps {
  appId: number
  name: string
  // See GamePosterArt's prop of the same name.
  knownArtSrc?: string
  // Marks membership of whatever this page manages (favorited, queued, whitelisted...). It's shown
  // permanently because scanning a grid for what's already added shouldn't require hovering it.
  isSelected?: boolean
  isDimmed?: boolean
  // For cards with no hover to wait for: a status card, or one whose action is the point of the page.
  isAlwaysRevealed?: boolean
  // False for a game that may not be in this account's library, which the game context menu assumes.
  hasContextMenu?: boolean
  // Permanent overlay in the top-left, e.g. an idle timer.
  badge?: ReactNode
  // Permanent status line at the bottom, e.g. drops remaining.
  meta?: ReactNode
  actions?: ReactNode
}

// The one card behind every game grid: portrait art filling the whole card, with the name and that
// page's actions rising over it on hover. Each page supplies only what differs, its `actions` and
// status, which is how the different button sets across pages share a single design.
//
// `group` sits on an outer box that doesn't move while the inner one lifts. If they were the same
// element, hovering its bottom few pixels would lift the card out from under the pointer, ending
// the hover, dropping it back, and flickering for as long as the pointer stayed there.
export const GamePosterCard = ({
  appId,
  name,
  knownArtSrc,
  isSelected,
  isDimmed,
  isAlwaysRevealed,
  hasContextMenu = true,
  badge,
  meta,
  actions,
}: GamePosterCardProps) => {
  const reveal = isAlwaysRevealed ? 'grid grid-rows-[1fr]' : REVEAL_CLASSNAME

  return (
    <div
      className={cn('group aspect-2/3 w-full', isDimmed && 'opacity-50')}
      {...(hasContextMenu ? gameCardContextAttrs(appId, name) : {})}
    >
      <div className='relative h-full w-full overflow-hidden rounded-xl bg-surface transition-[translate] duration-150 motion-safe:group-hover:-translate-y-1'>
        <GamePosterArt appId={appId} knownSrc={knownArtSrc} name={name} />

        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-linear-to-t from-black/95 via-black/65 to-transparent transition-opacity duration-150',
            meta || isAlwaysRevealed
              ? 'opacity-100'
              : 'opacity-0 group-has-focus-visible:opacity-100 group-hover:opacity-100',
          )}
        />

        {badge}

        {isSelected && (
          <div className='absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md'>
            <TbCheck fontSize={15} strokeWidth={3} />
          </div>
        )}

        {/* White rather than theme colours: this always sits on the dark gradient, over artwork. */}
        <div className='absolute inset-x-0 bottom-0 flex flex-col px-2.5 pb-2.5 text-white'>
          <div className={reveal}>
            <div className='min-h-0 overflow-hidden'>
              <p className='line-clamp-3 pb-1 text-sm font-semibold leading-snug' title={name}>
                {name}
              </p>
            </div>
          </div>
          {meta && <div className='text-xs font-medium text-white/85'>{meta}</div>}
          {actions && (
            <div className={reveal}>
              {/* The padding keeps the buttons' focus rings from being clipped by the overflow. */}
              <div className='min-h-0 overflow-hidden'>
                <div className='flex items-center gap-1 p-0.5 pt-1.5'>{actions}</div>
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            'pointer-events-none absolute inset-0 rounded-xl ring-inset transition-shadow duration-150 group-hover:ring-2 group-hover:ring-accent',
            isSelected ? 'ring-2 ring-accent/70' : 'ring-1 ring-white/10',
          )}
        />
      </div>
    </div>
  )
}

type GamePosterActionProps = Omit<ComponentProps<typeof Button>, 'isIconOnly' | 'size' | 'variant'>

// An icon-only button for the card's overlay. Solid white with a dark icon so it stands out the same
// over any game's art, where a see-through button was hard to spot on busy or bright artwork.
export const GamePosterAction = ({ className, ...props }: GamePosterActionProps) => (
  <Button
    isIconOnly
    className={cn('bg-white text-black shadow-md hover:bg-white/85', className)}
    size='sm'
    {...props}
  />
)
