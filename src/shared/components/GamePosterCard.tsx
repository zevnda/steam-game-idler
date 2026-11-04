import type { ComponentProps, ReactNode } from 'react'
import { createContext, useContext } from 'react'
import { TbCheck } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import { GamePosterArt } from '@/shared/components/GamePosterArt'
import { GameStatChips } from '@/shared/components/GameStatChips'
import { useGameCardStyleStore } from '@/shared/stores/gameCardStyleStore'
import { gameCardContextAttrs } from '@/shared/utils/gameCardContext'

// Collapses to zero height until the card is hovered or something inside it has keyboard focus. The
// content stays mounted and focusable throughout, so keyboard users can still reach the actions.
// `focus-visible`, not `focus-within`: a clicked button keeps focus, which would leave the card stuck
// open after the pointer moves away.
const REVEAL_CLASSNAME =
  'grid grid-rows-[0fr] transition-[grid-template-rows] duration-150 group-has-focus-visible:grid-rows-[1fr] group-hover:grid-rows-[1fr]'

// True while a card in a reorderable grid is being dragged. Every card there then stays in its resting
// state: the one being dragged sits under the pointer the whole time, and the others are hovered in
// turn as it passes over them, so their buttons would keep popping open mid-drag.
export const GameCardDragContext = createContext(false)

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
  // Keeps the tall shape whatever the game card style setting, for the fanned previews in empty
  // banners, which are laid out around it.
  forceCover?: boolean
  // Playtime and achievement chips, see GameStatChips
  showStats?: boolean
}

// The one card behind every game grid: art filling the whole card with the name over it, and that
// page's actions opening below the name on hover. Each page supplies only what differs, its `actions` and
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
  forceCover,
  showStats,
}: GamePosterCardProps) => {
  const cardStyle = useGameCardStyleStore(state => state.style)
  const style = forceCover ? 'cover' : cardStyle
  const isDragActive = useContext(GameCardDragContext)
  const reveal = isAlwaysRevealed
    ? 'grid grid-rows-[1fr]'
    : isDragActive
      ? 'grid grid-rows-[0fr]'
      : REVEAL_CLASSNAME

  return (
    <div
      className={cn(
        'group w-full',
        style === 'cover' ? 'aspect-2/3' : 'aspect-(--game-card-aspect)',
        isDimmed && 'opacity-50',
      )}
      {...(hasContextMenu ? gameCardContextAttrs(appId, name) : {})}
    >
      {/* The glow goes on this element rather than a child, because `overflow-hidden` clips a child's
          shadow but not the element's own. */}
      <div
        className={cn(
          'relative h-full w-full overflow-hidden rounded-xl bg-surface transition-[translate,box-shadow] duration-150',
          !isDragActive &&
            'group-hover:shadow-[0_0_16px_-2px_color-mix(in_oklab,var(--accent)_45%,transparent)] motion-safe:group-hover:-translate-y-1',
        )}
      >
        <GamePosterArt appId={appId} knownSrc={knownArtSrc} name={name} style={style} />

        {/* Always there, so the name below stays readable, and rising with it on hover to sit behind
            the buttons too. */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/95 via-black/65 to-transparent transition-[height] duration-150',
            meta || isAlwaysRevealed
              ? 'h-3/4'
              : isDragActive
                ? 'h-2/5'
                : 'h-2/5 group-has-focus-visible:h-3/4 group-hover:h-3/4',
          )}
        />

        {badge}

        {showStats && (
          <GameStatChips appId={appId} isSelected={Boolean(isSelected)} showPlaytime={!badge} />
        )}

        {isSelected && (
          <div className='absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md'>
            <TbCheck fontSize={15} strokeWidth={3} />
          </div>
        )}

        {/* White rather than theme colours: this always sits on the dark gradient, over artwork. */}
        <div className='absolute inset-x-0 bottom-0 flex flex-col px-2.5 pb-2.5 text-white'>
          {/* Always shown, rising as the buttons open below it on hover. The shadow helps on art
              that's bright right behind the text. */}
          <div className='grid grid-rows-[1fr]'>
            <div className='min-h-0 overflow-hidden'>
              <p
                className={cn(
                  'pb-1 text-sm font-semibold leading-snug [text-shadow:0_1px_2px_rgb(0_0_0/0.9),0_0_10px_rgb(0_0_0/0.7)]',
                  // A wide card is too short for more than a line alongside its buttons
                  style === 'cover' ? 'line-clamp-3' : 'line-clamp-1',
                )}
                title={name}
              >
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
            'pointer-events-none absolute inset-0 rounded-xl ring-inset transition-shadow duration-150',
            isSelected
              ? 'ring-2 ring-accent'
              : cn('ring-1 ring-white/10', !isDragActive && 'group-hover:ring-accent'),
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
