import { Skeleton } from '@heroui/react'

// Loading placeholders for the achievement manager overlay, shaped after the real content so the
// layout doesn't jump once data lands. Deliberately approximate where the real content varies
// game to game (how many sets a game has, how long names/descriptions run) - fixed counts and a
// few staggered widths, rather than trying to predict the real shape.
//
// All are plain blocks, not flex columns, so the fixed-height rows can't shrink to fit the
// height-limited pane (see AchievementOrderList.tsx's AchievementOrderSkeleton for the same trap);
// the pane clips whatever runs past its bottom.

// Staggered so rows don't read as identical stripes.
const NAME_WIDTHS = ['w-56', 'w-40', 'w-64', 'w-48', 'w-36', 'w-60']
const DESCRIPTION_WIDTHS = ['w-80', 'w-96', 'w-72', 'w-104', 'w-64', 'w-88']
const ROW_COUNT = 12

// The pane header both views share: title line, then the controls line (AchievementsView.tsx /
// StatisticsView.tsx's `px-6 pt-5 pb-4` header).
const PaneHeaderSkeleton = ({ controls }: { controls: 'achievements' | 'statistics' }) => (
  <div className='flex shrink-0 flex-col gap-3 px-6 pt-5 pb-4'>
    <Skeleton className='h-8 w-56 rounded-lg' />
    <div className='flex items-center gap-3'>
      <Skeleton className='h-10 min-w-48 flex-1 rounded-full' />
      {controls === 'achievements' ? (
        <>
          <Skeleton className='h-10 w-60 rounded-full' />
          <Skeleton className='h-10 w-62 rounded-full' />
        </>
      ) : (
        <Skeleton className='h-10 w-32 rounded-full' />
      )}
    </div>
  </div>
)

// AchievementListItem's shape: selection circle, 44px icon, name + description, rarity pill, and
// the round quick lock/unlock button. 64px card + 8px gap, same as AchievementList.tsx's rows.
export const AchievementsViewSkeleton = () => (
  <div className='flex min-h-0 flex-1 flex-col'>
    <PaneHeaderSkeleton controls='achievements' />
    <div className='min-h-0 flex-1 overflow-hidden px-6'>
      {Array.from({ length: ROW_COUNT }, (_, index) => (
        <div key={index} className='pb-2'>
          <div className='flex h-16 items-center gap-3 rounded-xl border border-border bg-surface px-3'>
            <Skeleton className='size-5 shrink-0 rounded-full' />
            <Skeleton className='size-11 shrink-0 rounded-lg' />
            <div className='flex min-w-0 flex-1 flex-col gap-2'>
              <Skeleton
                className={`h-3.5 max-w-full rounded-full ${NAME_WIDTHS[index % NAME_WIDTHS.length]}`}
              />
              <Skeleton
                className={`h-3 max-w-full rounded-full ${DESCRIPTION_WIDTHS[index % DESCRIPTION_WIDTHS.length]}`}
              />
            </div>
            <Skeleton className='h-4.5 w-28 shrink-0 rounded-full' />
            <Skeleton className='size-8 shrink-0 rounded-full' />
          </div>
        </div>
      ))}
    </div>
  </div>
)

// StatisticRow's shape: a name on the left, the number stepper on the right.
export const StatisticsViewSkeleton = () => (
  <div className='flex min-h-0 flex-1 flex-col'>
    <PaneHeaderSkeleton controls='statistics' />
    <div className='min-h-0 flex-1 overflow-hidden px-6'>
      {Array.from({ length: ROW_COUNT }, (_, index) => (
        // `mt-2` (not `pb-2`) - StatisticsList.tsx's rows put their gap above the card.
        <div key={index} className='mt-2'>
          <div className='flex h-14 items-center gap-3 rounded-xl border border-border bg-surface px-4'>
            <Skeleton
              className={`h-3.5 max-w-full rounded-full ${NAME_WIDTHS[index % NAME_WIDTHS.length]}`}
            />
            <Skeleton className='ml-auto h-9 w-36 shrink-0 rounded-xl' />
          </div>
        </div>
      ))}
    </div>
  </div>
)

// The sidebar's progress block, bulk buttons and nav, shown under the (already known) art and
// name while the first load runs. Rendered inside the sidebar's own `px-1` art/name block, hence no
// padding of its own up top. Four set entries is a guess - most games have one or two, DLC-heavy
// ones far more - so it just suggests "a list of sets goes here".
export const AchievementManagerSidebarSkeleton = () => (
  <div className='flex flex-col'>
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-3'>
        <Skeleton className='size-18 shrink-0 rounded-full' />
        <Skeleton className='h-3.5 w-32 rounded-full' />
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <Skeleton className='h-8 rounded-full' />
        <Skeleton className='h-8 rounded-full' />
      </div>
    </div>
    <div className='px-3 pt-4 pb-1'>
      <Skeleton className='h-3 w-28 rounded-full' />
    </div>
    {Array.from({ length: 4 }, (_, index) => (
      <div key={index} className='flex flex-col gap-2 px-3 py-2.5'>
        <div className='flex items-center justify-between gap-2'>
          <Skeleton className={`h-3.5 rounded-full ${['w-36', 'w-24', 'w-40', 'w-32'][index]}`} />
          <Skeleton className='h-3 w-8 rounded-full' />
        </div>
        <Skeleton className='h-1 w-full rounded-full' />
      </div>
    ))}
  </div>
)
