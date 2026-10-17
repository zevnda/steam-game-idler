import type { StatDto } from '../types'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { TbPencil, TbRotateClockwise, TbX } from 'react-icons/tb'
import { searchByName } from '../utils/searchByName'
import { FloatingActionBar } from './FloatingActionBar'
import { ProtectedNotice } from './ProtectedNotice'
import { StatisticsList } from './StatisticsList'
import { AlertDialog, Button, EmptyState, InputGroup, Typography } from '@heroui/react'

interface StatisticsViewProps {
  stats: StatDto[]
  isMutating: boolean
  onSave: (edits: Record<string, number>) => Promise<boolean>
  onResetAll: () => Promise<boolean>
}

// Main pane of the split-view Achievement Manager when "Statistics" is picked in
// AchievementManagerSidebar.tsx - same toolbar shape as AchievementsView.tsx (title + count, then
// search and actions) so the two panes read as one tool. Edits are staged per stat and committed
// together from the FloatingActionBar. `edits` stays keyed by every stat the user has actually touched
// regardless of the search (a stat filtered out of view after being edited still gets saved), since
// `update_stats`/`reset_all_stats` apply to whatever's pending/exists, not whatever's visible.
export const StatisticsView = ({ stats, isMutating, onSave, onResetAll }: StatisticsViewProps) => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [edits, setEdits] = useState<Record<string, number>>({})
  const [confirmReset, setConfirmReset] = useState(false)
  const filteredStats = useMemo(() => searchByName(stats, query), [stats, query])
  const editedCount = Object.keys(edits).length
  const hasProtectedStats = stats.some(stat => stat.protectedStat)

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
    if (await onSave(edits)) setEdits({})
  }

  const handleConfirmReset = async () => {
    if (await onResetAll()) setEdits({})
    setConfirmReset(false)
  }

  return (
    // `relative` - FloatingActionBar positions itself over the bottom of this pane.
    <div className='relative flex h-full min-h-0 flex-col'>
      {/* Same two-row header as AchievementsView.tsx: title line, then the controls line. */}
      <div className='flex shrink-0 flex-col gap-3 px-6 pt-5 pb-4' data-tauri-drag-region>
        <div className='flex min-w-0 items-center gap-3' data-tauri-drag-region>
          {/* No count beside the title - the sidebar's Statistics entry already shows it. */}
          <div className='flex min-w-0 flex-1' data-tauri-drag-region>
            <Typography truncate type='h3'>
              {t('dashboard.achievements.tabs.statistics')}
            </Typography>
          </div>
          {hasProtectedStats && <ProtectedNotice />}
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          <InputGroup className='min-w-48 flex-1 rounded-full'>
            <InputGroup.Prefix>
              <RiSearchLine className='text-muted' fontSize={16} />
            </InputGroup.Prefix>
            <InputGroup.Input
              placeholder={t('common.search.placeholder')}
              value={query}
              onChange={event => setQuery(event.target.value)}
            />
            {query && (
              <InputGroup.Suffix>
                <button
                  aria-label={t('common.actions.clear')}
                  type='button'
                  onClick={() => setQuery('')}
                >
                  <TbX fontSize={16} />
                </button>
              </InputGroup.Suffix>
            )}
          </InputGroup>
          <Button
            isDisabled={stats.length === 0}
            isPending={isMutating}
            variant='danger-soft'
            onPress={() => setConfirmReset(true)}
          >
            <TbRotateClockwise fontSize={16} />
            {t('dashboard.achievements.actions.resetAll')}
          </Button>
        </div>
      </div>

      <div className='min-h-0 flex-1'>
        {stats.length === 0 ? (
          <EmptyState className='flex h-full flex-col items-center justify-center gap-2 p-8 text-center'>
            <Typography type='h3'>{t('dashboard.achievements.emptyStats.title')}</Typography>
            <Typography color='muted' type='body-sm'>
              {t('dashboard.achievements.emptyStats.description')}
            </Typography>
          </EmptyState>
        ) : filteredStats.length === 0 ? (
          <EmptyState className='flex h-full flex-col items-center justify-center gap-2 p-8 text-center'>
            <RiSearchLine fontSize={32} />
            <Typography type='h3'>{t('dashboard.achievements.searchNoResults.title')}</Typography>
            <Typography color='muted' type='body-sm'>
              {t('dashboard.achievements.searchNoResults.description')}
            </Typography>
          </EmptyState>
        ) : (
          <StatisticsList
            edits={edits}
            hasActionBar={editedCount > 0}
            stats={filteredStats}
            onChange={handleChange}
          />
        )}
      </div>

      {editedCount > 0 && (
        <FloatingActionBar
          icon={<TbPencil fontSize={16} />}
          label={t('dashboard.achievements.pendingChanges', { count: editedCount })}
        >
          <Button isDisabled={isMutating} size='sm' variant='ghost' onPress={() => setEdits({})}>
            {t('common.actions.clear')}
          </Button>
          <Button isPending={isMutating} size='sm' variant='primary' onPress={handleSave}>
            {t('dashboard.achievements.actions.saveChanges')}
          </Button>
        </FloatingActionBar>
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
