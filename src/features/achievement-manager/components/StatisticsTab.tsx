import type { StatDto } from '../types'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbChartBar, TbDeviceFloppy, TbRefresh, TbRotateClockwise } from 'react-icons/tb'
import { searchByName } from '../utils/searchByName'
import { StatisticsList } from './StatisticsList'
import { AlertDialog, Button, EmptyState, Typography } from '@heroui/react'

interface StatisticsTabProps {
  stats: StatDto[]
  query: string
  isMutating: boolean
  isRefreshing: boolean
  onSave: (edits: Record<string, number>) => Promise<boolean>
  onResetAll: () => Promise<boolean>
  onRefresh: () => void
}

// Search lives in the shared page header (AchievementManagerHeader) - only narrows which rows
// render here. `edits` stays keyed by every stat the user has actually touched regardless of the
// current filter (a stat filtered out of view after being edited still gets saved), and
// `editedCount`/Save/Reset all stay unaffected by the filter for the same reason `AchievementsTab`'s
// bulk actions do: those backend commands (`update_stats`/`reset_all_stats`) apply to whatever's
// actually pending/exists, not whatever's currently visible.
export const StatisticsTab = ({
  stats,
  query,
  isMutating,
  isRefreshing,
  onSave,
  onResetAll,
  onRefresh,
}: StatisticsTabProps) => {
  const { t } = useTranslation()
  const [edits, setEdits] = useState<Record<string, number>>({})
  const [confirmReset, setConfirmReset] = useState(false)
  const filteredStats = useMemo(() => searchByName(stats, query), [stats, query])
  const editedCount = Object.keys(edits).length

  const handleChange = (stat: StatDto, value: number) => {
    setEdits(prev => {
      if (value === stat.value) {
        const next = { ...prev }
        delete next[stat.id]
        return next
      }
      return { ...prev, [stat.id]: value }
    })
  }

  const handleSave = async () => {
    const ok = await onSave(edits)
    if (ok) {
      setEdits({})
    }
  }

  const handleConfirmReset = async () => {
    const ok = await onResetAll()
    if (ok) {
      setEdits({})
    }
    setConfirmReset(false)
  }

  if (stats.length === 0) {
    return (
      <EmptyState className='flex flex-col items-center justify-center gap-2 p-8 text-center'>
        <Typography type='h3'>{t('dashboard.achievements.emptyStats.title')}</Typography>
        <Typography color='muted' type='body-sm'>
          {t('dashboard.achievements.emptyStats.description')}
        </Typography>
      </EmptyState>
    )
  }

  return (
    <div className='flex h-full min-h-0 flex-col gap-3'>
      <div className='flex shrink-0 items-center justify-between gap-4'>
        {/* Icon-prefixed count + an "N edited" pill once something's staged - mirrors
            AchievementsTab.tsx's trophy readout for visual parity between the two tabs, without
            faking a progress bar here (stats have no inherent "completion" the way achievements
            do - each edited row already gets its own pill too, see StatisticRow.tsx). */}
        <div className='flex min-w-0 items-center gap-2 bg-surface px-3 py-2 rounded-lg'>
          <TbChartBar className='shrink-0 text-muted' fontSize={18} />
          <Typography color='muted' type='body-sm'>
            {t('dashboard.achievements.statCount', { count: stats.length })}
          </Typography>
          {editedCount > 0 && (
            <span className='shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent'>
              {t('dashboard.achievements.editedCount', { count: editedCount })}
            </span>
          )}
        </div>
        <div className='flex gap-2'>
          <Button isDisabled={editedCount === 0} isPending={isMutating} onPress={handleSave}>
            <TbDeviceFloppy fontSize={16} />
            {editedCount > 0
              ? t('dashboard.achievements.actions.saveChangesCount', { count: editedCount })
              : t('dashboard.achievements.actions.saveChanges')}
          </Button>
          <Button isPending={isMutating} variant='danger' onPress={() => setConfirmReset(true)}>
            <TbRotateClockwise fontSize={16} />
            {t('dashboard.achievements.actions.resetAll')}
          </Button>
          <Button
            isIconOnly
            aria-label={t('common.actions.refresh')}
            isPending={isRefreshing}
            onPress={onRefresh}
          >
            <TbRefresh fontSize={16} />
          </Button>
        </div>
      </div>

      {filteredStats.length === 0 ? (
        <EmptyState className='flex flex-col items-center justify-center gap-2 p-8 text-center'>
          <RiSearchLine fontSize={32} />
          <Typography type='h3'>{t('dashboard.achievements.searchNoResults.title')}</Typography>
          <Typography color='muted' type='body-sm'>
            {t('dashboard.achievements.searchNoResults.description')}
          </Typography>
        </EmptyState>
      ) : (
        <div className='flex min-h-0 flex-1 flex-col'>
          {/* Genuinely fixed above the virtualized list below - see AchievementsTab.tsx's
              matching column-header comment for why this no longer needs `sticky`. Grid template
              matches StatisticRow.tsx's own ROW_GRID - keep both in sync. */}
          <div className='bg-surface grid shrink-0 grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg border-b border-border px-3 py-2'>
            <span aria-hidden />
            <Typography color='muted' type='body-xs' weight='semibold'>
              {t('dashboard.achievements.tabs.statistics')}
            </Typography>
            <span aria-hidden />
          </div>
          <div className='min-h-0 flex-1'>
            <StatisticsList edits={edits} stats={filteredStats} onChange={handleChange} />
          </div>
        </div>
      )}

      <AlertDialog isOpen={confirmReset} onOpenChange={open => !open && setConfirmReset(false)}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>
                  {t('dashboard.achievements.confirmResetStats.title')}
                </AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                {t('dashboard.achievements.confirmResetStats.description')}
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button
                  isDisabled={isMutating}
                  variant='secondary'
                  onPress={() => setConfirmReset(false)}
                >
                  {t('common.actions.cancel')}
                </Button>
                <Button isPending={isMutating} variant='danger' onPress={handleConfirmReset}>
                  {t('dashboard.achievements.actions.resetAll')}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  )
}
