// Marks a game card's root element so the app-wide context menu (useContextMenu.ts) can recognize
// a right-click as landing on a specific game rather than falling back to the generic Copy/Paste
// menu. Plain DOM data attributes rather than React context - the context menu is a single
// document-level listener with no reactive dependency on which card was clicked, it only needs to
// read this off the actual click target at contextmenu time.
export const GAME_CARD_APP_ID_ATTR = 'data-game-card-appid'
export const GAME_CARD_NAME_ATTR = 'data-game-card-name'

export function gameCardContextAttrs(appId: number, name: string) {
  return { [GAME_CARD_APP_ID_ATTR]: appId, [GAME_CARD_NAME_ATTR]: name }
}

export interface GameCardTarget {
  appId: number
  name: string
}

export function findGameCardTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null
  const el = target.closest(`[${GAME_CARD_APP_ID_ATTR}]`)
  if (!el) return null
  const appId = Number(el.getAttribute(GAME_CARD_APP_ID_ATTR))
  const name = el.getAttribute(GAME_CARD_NAME_ATTR)
  if (!Number.isFinite(appId) || !name) return null
  return { appId, name }
}
