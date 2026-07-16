// Lets the game-card context menu (which mutates a list from outside that list's own page) push
// the resulting full list into whichever of favorites/achievement-unlocker-queue/auto-idle-list/
// card-farming-queue hook instance happens to be mounted right now. Those hooks are deliberately
// page-scoped useState + fetch-on-mount (see each one's own doc comment) since until now a list
// only ever changed from a click inside that feature's own UI - the context menu breaks that
// premise, so a mounted hook needs a way to hear about a change made from elsewhere without a
// bigger rework into a shared store.
export type GameListName =
  'favorites' | 'achievementUnlockerQueue' | 'autoIdleList' | 'cardFarmingQueue'

const bus = new EventTarget()

export function emitGameListChange<T>(list: GameListName, entries: T[]) {
  bus.dispatchEvent(new CustomEvent(list, { detail: entries }))
}

export function onGameListChange<T>(list: GameListName, callback: (entries: T[]) => void) {
  const handler = (event: Event) => callback((event as CustomEvent<T[]>).detail)
  bus.addEventListener(list, handler)
  return () => bus.removeEventListener(list, handler)
}
