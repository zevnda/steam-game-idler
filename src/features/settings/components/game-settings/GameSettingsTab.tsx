import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiPencilLine, RiSearchLine } from 'react-icons/ri'
import { TbX } from 'react-icons/tb'
import { useGameSettings } from '../../hooks/useGameSettings'
import { errorMessageKey, gameSettingsErrorMessageKey } from '../../utils/errorMessageKey'
import { GameSettingsGameList } from './GameSettingsGameList'
import { Alert, Button, InputGroup, Skeleton, toast, ToggleButton, Typography } from '@heroui/react'
import { useGamesList } from '@/features/games-list/hooks/useGamesList'
import { InputField } from '@/shared/components/InputField'
import { SettingsRow } from '@/shared/components/SettingsRow'

// The Game Settings tab - a cross-cutting screen over idling/card-farming/achievement-unlocker's
// own auto-stop caps, plus `max_playtime`'s own cross-feature cap (see `useGameSettings.ts`'s doc
// comment). Layout mirrors `main`'s own GameSettings.tsx (a searchable game list on the left,
// account-wide + per-game fields on the right) - kept since it's genuinely unambiguous UX (global
// fields disabled while a game is selected and vice versa), not because it needs to match
// pixel-for-pixel.
//
// Fields render as four bordered `SettingsSection`s (Max Playtime / Idling / Card Farming /
// Achievement Unlocker), reusing `KeybindsSettingsTab.tsx`'s established `rounded-lg
// border border-border` grouped-box convention - the fields otherwise read as one undifferentiated,
// cramped list despite governing architecturally separate auto-stop mechanisms
// (`max_playtime::enforcement`, `idling::auto_stop`, `card_farming::manager`,
// `achievement_unlocker::manager`), which was a real source of user confusion: nothing signalled
// that "max idle time" never applies to a game being card-farmed or achievement-unlocked. Max
// Playtime gets the top section (rather than a fourth per-feature one, or a note repeated in each
// of the other three) since it's the one cap that genuinely applies everywhere - manual idling,
// auto-idle, achievement unlocking, and card farming alike.
export const GameSettingsTab = () => {
  const { t } = useTranslation()
  const { games } = useGamesList()
  const [searchTerm, setSearchTerm] = useState('')
  const [showOnlyCustomized, setShowOnlyCustomized] = useState(false)
  const {
    selectedAppId,
    selectGame,
    customizedAppIds,
    globalMaxIdleTime,
    globalMaxCardFarmingTime,
    globalMaxPlaytime,
    perGame,
    isLoading,
    loadErrorCode,
    actionErrorCode,
    refresh,
    setGlobalMaxIdleTime,
    setGlobalMaxCardFarmingTime,
    setMaxIdleTime,
    setMaxCardDrops,
    setMaxCardFarmingTime,
    setMaxAchievementUnlocks,
    setGlobalMaxPlaytime,
    setMaxPlaytime,
  } = useGameSettings()

  // Reverts to the unfiltered list once nothing is left to filter for - covers the last
  // customized game having its override cleared while this filter is still active, which would
  // otherwise leave the list empty with no obvious way to tell why.
  useEffect(() => {
    if (showOnlyCustomized && customizedAppIds.size === 0) {
      setShowOnlyCustomized(false)
    }
  }, [showOnlyCustomized, customizedAppIds])

  const filteredGames = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    let matching = term
      ? games.filter(game => (game.name ?? '').toLowerCase().includes(term))
      : games
    if (showOnlyCustomized) {
      matching = matching.filter(game => customizedAppIds.has(game.appId))
    }
    return [...matching].sort((a, b) =>
      (a.name ?? String(a.appId)).localeCompare(b.name ?? String(b.appId)),
    )
  }, [games, searchTerm, showOnlyCustomized, customizedAppIds])

  const reportFailure = () => {
    if (actionErrorCode) {
      toast.danger(t(gameSettingsErrorMessageKey(actionErrorCode), { code: actionErrorCode }))
    }
  }

  // Adapts each `setXxx` save call to `InputField`'s `Promise<boolean>` contract, folding
  // in the failure toast so every field doesn't need to repeat it.
  const withFailureToast = (save: (value: number) => Promise<boolean>) => async (value: number) => {
    const ok = await save(value)
    if (!ok) reportFailure()
    return ok
  }

  // Clicking the already-selected game deselects it (back to the account-wide fields) instead of
  // requiring a navigate-away-and-back round trip to clear the selection.
  const handleSelectGame = (appId: number) => {
    selectGame(current => (current === appId ? null : appId))
  }

  if (loadErrorCode) {
    return (
      <div className='flex flex-col items-center gap-4 p-8 text-center'>
        <Alert className='max-w-md' status='danger'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('dashboard.settings.errors.title')}</Alert.Title>
            <Alert.Description>
              {t(errorMessageKey(loadErrorCode), { code: loadErrorCode })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <Button variant='secondary' onPress={refresh}>
          {t('common.actions.tryAgain')}
        </Button>
      </div>
    )
  }

  return (
    <div className='flex min-h-0 flex-1 flex-col gap-5'>
      <Typography type='h3' className='font-bold mb-4'>
        {t('dashboard.settings.gameSettings.title')}
      </Typography>

      <div className='flex min-h-0 flex-1 gap-6'>
        <div className='flex w-72 shrink-0 flex-col gap-2'>
          <Typography color='muted' type='body-xs' weight='semibold'>
            {t('dashboard.sidebar.nav.games')}
          </Typography>
          <div className='flex items-center gap-2'>
            <InputGroup>
              <InputGroup.Prefix>
                <RiSearchLine className='text-muted' fontSize={16} />
              </InputGroup.Prefix>
              <InputGroup.Input
                aria-label={t('common.search.placeholder')}
                placeholder={t('common.search.placeholder')}
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
              />
              {searchTerm && (
                <InputGroup.Suffix>
                  <button aria-label='Clear search' type='button' onClick={() => setSearchTerm('')}>
                    <TbX fontSize={14} />
                  </button>
                </InputGroup.Suffix>
              )}
            </InputGroup>
            <ToggleButton
              isIconOnly
              isDisabled={customizedAppIds.size === 0}
              isSelected={showOnlyCustomized}
              aria-label={t('dashboard.settings.gameSettings.filterCustomized')}
              onChange={setShowOnlyCustomized}
            >
              <RiPencilLine fontSize={16} />
            </ToggleButton>
          </div>
          <div
            aria-label={t('dashboard.sidebar.nav.games')}
            className='h-104 overflow-hidden rounded-lg border border-border'
            role='region'
          >
            <GameSettingsGameList
              customizedAppIds={customizedAppIds}
              games={filteredGames}
              selectedAppId={selectedAppId}
              onSelect={handleSelectGame}
            />
          </div>
        </div>

        <div className='flex flex-1 flex-col gap-5 overflow-y-auto'>
          {isLoading ? (
            <div className='flex flex-col gap-5'>
              {[
                { section: 'maxPlaytime', rows: ['globalMaxPlaytime', 'maxPlaytime'] },
                { section: 'idling', rows: ['globalMaxIdleTime', 'maxIdleTime'] },
                {
                  section: 'cardFarming',
                  rows: ['globalMaxCardFarmingTime', 'maxCardFarmingTime', 'maxCardDrops'],
                },
                { section: 'achievementUnlocker', rows: ['maxAchievementUnlocks'] },
              ].map(({ section, rows }) => (
                <div className='flex flex-col gap-2' key={section}>
                  <Skeleton className='h-4 w-32 rounded' />
                  <div className='flex flex-col gap-4 rounded-lg border border-border p-4'>
                    {rows.map(field => (
                      <Skeleton className='h-12 w-full rounded-lg' key={field} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <SettingsSection
                label={t('dashboard.settings.gameSettings.maxPlaytimeSection')}
                note={t('dashboard.settings.gameSettings.maxPlaytimeScopeNote')}
              >
                <SettingsRow
                  description={t('dashboard.settings.gameSettings.globalMaxPlaytime.description')}
                  title={t('dashboard.settings.gameSettings.globalMaxPlaytime.label')}
                >
                  <InputWithHint hint={t('common.zeroUnlimitedHint')}>
                    <InputField
                      ariaLabel={t('dashboard.settings.gameSettings.globalMaxPlaytime.label')}
                      isDisabled={selectedAppId !== null}
                      minValue={0}
                      value={globalMaxPlaytime}
                      onCommit={withFailureToast(setGlobalMaxPlaytime)}
                    />
                  </InputWithHint>
                </SettingsRow>

                <SettingsRow
                  description={t('dashboard.settings.gameSettings.maxPlaytime.description')}
                  showDivider={false}
                  title={t('dashboard.settings.gameSettings.maxPlaytime.label')}
                >
                  <InputWithHint hint={t('common.zeroUnlimitedHint')}>
                    <InputField
                      ariaLabel={t('dashboard.settings.gameSettings.maxPlaytime.label')}
                      isDisabled={selectedAppId === null}
                      minValue={0}
                      value={perGame.maxPlaytime ?? 0}
                      onCommit={withFailureToast(setMaxPlaytime)}
                    />
                  </InputWithHint>
                </SettingsRow>
              </SettingsSection>

              <SettingsSection
                label={t('dashboard.sidebar.nav.idling')}
                note={t('dashboard.settings.gameSettings.idlingScopeNote')}
              >
                <SettingsRow
                  description={t('dashboard.settings.gameSettings.globalMaxIdleTime.description')}
                  title={t('dashboard.settings.gameSettings.globalMaxIdleTime.label')}
                >
                  <InputWithHint hint={t('common.zeroUnlimitedHint')}>
                    <InputField
                      ariaLabel={t('dashboard.settings.gameSettings.globalMaxIdleTime.label')}
                      isDisabled={selectedAppId !== null}
                      minValue={0}
                      value={globalMaxIdleTime}
                      onCommit={withFailureToast(setGlobalMaxIdleTime)}
                    />
                  </InputWithHint>
                </SettingsRow>

                <SettingsRow
                  description={t('dashboard.settings.gameSettings.maxIdleTime.description')}
                  showDivider={false}
                  title={t('dashboard.settings.gameSettings.maxIdleTime.label')}
                >
                  <InputWithHint hint={t('common.zeroUnlimitedHint')}>
                    <InputField
                      ariaLabel={t('dashboard.settings.gameSettings.maxIdleTime.label')}
                      isDisabled={selectedAppId === null}
                      minValue={0}
                      value={perGame.maxIdleTime ?? 0}
                      onCommit={withFailureToast(setMaxIdleTime)}
                    />
                  </InputWithHint>
                </SettingsRow>
              </SettingsSection>

              <SettingsSection
                label={t('dashboard.sidebar.nav.cardFarming')}
                note={t('dashboard.settings.gameSettings.cardFarmingScopeNote')}
              >
                <SettingsRow
                  description={t(
                    'dashboard.settings.gameSettings.globalMaxCardFarmingTime.description',
                  )}
                  title={t('dashboard.settings.gameSettings.globalMaxCardFarmingTime.label')}
                >
                  <InputWithHint hint={t('common.zeroUnlimitedHint')}>
                    <InputField
                      ariaLabel={t(
                        'dashboard.settings.gameSettings.globalMaxCardFarmingTime.label',
                      )}
                      isDisabled={selectedAppId !== null}
                      minValue={0}
                      value={globalMaxCardFarmingTime}
                      onCommit={withFailureToast(setGlobalMaxCardFarmingTime)}
                    />
                  </InputWithHint>
                </SettingsRow>

                <SettingsRow
                  description={t('dashboard.settings.gameSettings.maxCardFarmingTime.description')}
                  title={t('dashboard.settings.gameSettings.maxCardFarmingTime.label')}
                >
                  <InputWithHint hint={t('common.zeroUnlimitedHint')}>
                    <InputField
                      ariaLabel={t('dashboard.settings.gameSettings.maxCardFarmingTime.label')}
                      isDisabled={selectedAppId === null}
                      minValue={0}
                      value={perGame.maxCardFarmingTime ?? 0}
                      onCommit={withFailureToast(setMaxCardFarmingTime)}
                    />
                  </InputWithHint>
                </SettingsRow>

                <SettingsRow
                  description={t('dashboard.settings.gameSettings.maxCardDrops.description')}
                  showDivider={false}
                  title={t('dashboard.settings.gameSettings.maxCardDrops.label')}
                >
                  <InputWithHint hint={t('dashboard.settings.gameSettings.maxCardDrops.hint')}>
                    <InputField
                      ariaLabel={t('dashboard.settings.gameSettings.maxCardDrops.label')}
                      isDisabled={selectedAppId === null}
                      minValue={0}
                      value={perGame.maxCardDrops ?? 0}
                      onCommit={withFailureToast(setMaxCardDrops)}
                    />
                  </InputWithHint>
                </SettingsRow>
              </SettingsSection>

              <SettingsSection label={t('dashboard.sidebar.nav.achievementUnlocker')}>
                <SettingsRow
                  description={t(
                    'dashboard.settings.gameSettings.maxAchievementUnlocks.description',
                  )}
                  showDivider={false}
                  title={t('dashboard.settings.gameSettings.maxAchievementUnlocks.label')}
                >
                  <InputWithHint hint={t('common.zeroUnlimitedHint')}>
                    <InputField
                      ariaLabel={t('dashboard.settings.gameSettings.maxAchievementUnlocks.label')}
                      isDisabled={selectedAppId === null}
                      minValue={0}
                      value={perGame.maxAchievementUnlocks ?? 0}
                      onCommit={withFailureToast(setMaxAchievementUnlocks)}
                    />
                  </InputWithHint>
                </SettingsRow>
              </SettingsSection>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// A labelled, bordered group of `SettingsRow`s - one per owning feature (idling/card farming/
// achievement unlocker) - reusing `KeybindsSettingsTab.tsx`'s `KeybindSection` box convention so
// this tab reads consistently with the rest of Settings instead of one flat, undifferentiated
// list. `note` holds a scope caveat shared by every field in the group (e.g. idling's manual/
// auto-idle-only scope) - stated once here rather than repeated in each field's own description.
const SettingsSection = ({
  label,
  note,
  children,
}: {
  label: string
  note?: string
  children: ReactNode
}) => (
  <div className='flex flex-col gap-2'>
    <div className='flex flex-col gap-0.5'>
      <Typography color='muted' type='body-xs' weight='semibold'>
        {label}
      </Typography>
      {note && (
        <Typography color='muted' type='body-xs'>
          {note}
        </Typography>
      )}
    </div>
    <div className='flex flex-col gap-4 rounded-lg border border-border p-4'>{children}</div>
  </div>
)

// The "0 = ..." sentinel explanation lives here, under the input it actually governs, rather than
// buried in the row's description prose - keeps the description free to explain scope/precedence
// while this stays a quick visual reference right next to the value it describes.
const InputWithHint = ({ hint, children }: { hint: string; children: ReactNode }) => (
  <div className='flex flex-col items-end gap-1'>
    {children}
    <Typography className='whitespace-nowrap' color='muted' type='body-xs'>
      {hint}
    </Typography>
  </div>
)
