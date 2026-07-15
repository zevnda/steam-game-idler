import type { OwnedGame } from '@/features/games-list/types'
import type { RowComponentProps } from 'react-window'
import { List } from 'react-window'
import { cn, Typography } from '@heroui/react'
import { GameThumbnail } from '@/shared/components/GameThumbnail'

const ROW_HEIGHT = 52

interface RowProps {
  games: OwnedGame[]
  selectedAppId: number | null
  customizedAppIds: Set<number>
  onSelect: (appId: number) => void
}

// `ariaAttributes` (react-window's own `role="listitem"`/`aria-posinset`/`aria-setsize`) go on this
// outer wrapper, not the inner `<button>` - mirrors `VirtualizedGameGrid.tsx`'s `Cell` wrapping
// `renderCard` in a plain `div` for the same reason: an explicit `role` attribute overrides an
// element's implicit role, so putting `role="listitem"` directly on the `<button>` itself would
// silently strip its "button" role from the accessibility tree (and from Playwright's
// `getByRole('button')`), even though the click handler would still fire for a mouse/pointer click.
const Row = ({
  ariaAttributes,
  index,
  style,
  games,
  selectedAppId,
  customizedAppIds,
  onSelect,
}: RowComponentProps<RowProps>) => {
  const game = games[index]
  if (!game) return null
  const isSelected = game.appId === selectedAppId
  const isCustomized = customizedAppIds.has(game.appId)
  const name = game.name ?? String(game.appId)

  return (
    <div {...ariaAttributes} style={style}>
      <button
        aria-pressed={isSelected}
        className={cn(
          'flex h-full w-full items-center gap-3 border-l-2 px-3 py-1.5 text-left',
          'hover:bg-surface-hover',
          isSelected && 'border-accent bg-surface-hover',
        )}
        type='button'
        onClick={() => onSelect(game.appId)}
      >
        <div className='h-9 w-18 shrink-0'>
          <GameThumbnail appId={game.appId} name={name} />
        </div>
        <Typography className='flex-1 truncate' type='body-sm'>
          {name}
        </Typography>
        {isCustomized && <span className='size-1.5 shrink-0 rounded-full bg-accent' />}
      </button>
    </div>
  )
}

interface GameSettingsGameListProps {
  games: OwnedGame[]
  selectedAppId: number | null
  customizedAppIds: Set<number>
  onSelect: (appId: number) => void
}

// A single-column virtualized row list - the row-list sibling of `VirtualizedGameGrid.tsx`'s
// `Grid` (react-window v2's `List`, same package, no width-measurement math needed since a list
// has only one column). Not built on top of `VirtualizedGameGrid` itself since that component is
// grid-shaped (multi-column, thumbnail-forward cards) - this needs a compact single-column row
// picker instead, the same shape `main`'s own GameSettings.tsx uses for the same purpose. Scoped to
// this feature folder rather than promoted to `shared/components` - extract once a second caller
// needs the same shape, not before (see `GameThumbnail`'s own doc comment).
export const GameSettingsGameList = ({
  games,
  selectedAppId,
  customizedAppIds,
  onSelect,
}: GameSettingsGameListProps) => (
  <List
    rowComponent={Row}
    rowCount={games.length}
    rowHeight={ROW_HEIGHT}
    rowProps={{ games, selectedAppId, customizedAppIds, onSelect }}
    style={{ height: '100%', width: '100%' }}
  />
)
