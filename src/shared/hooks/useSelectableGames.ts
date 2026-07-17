import type { SelectableGame } from '@/shared/stores/gameSelectionStore'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

// Resolves a nullable-name game array (`OwnedGame[]`, or any per-feature entry type with the same
// `{ appId, name }` shape) into the `SelectableGame[]` view every card's `orderedGames` prop needs
// for Shift-click range-select - computed once per page/grid via `useMemo`, not inside each card,
// since a virtualized grid re-renders many cards per scroll and a per-card fallback map would be
// wasted O(n) work repeated for every visible card (see `useCardSelection.ts`).
export function useSelectableGames<T extends { appId: number; name: string | null }>(games: T[]) {
  const { t } = useTranslation()
  return useMemo<SelectableGame[]>(
    () =>
      games.map(game => ({
        appId: game.appId,
        name: game.name ?? t('dashboard.games.unknownName', { appId: game.appId }),
      })),
    [games, t],
  )
}
