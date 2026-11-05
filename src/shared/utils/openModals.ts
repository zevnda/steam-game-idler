// Marks an app overlay that isn't a HeroUI Modal/AlertDialog (HelpDesk's live-chat backdrop), so
// `countOpenModals` sees it too. Put it on the element that only exists while the overlay is open.
export const APP_OVERLAY_ATTR = 'data-app-overlay'

// Every HeroUI Modal and AlertDialog renders a backdrop with one of these data-slots while open (see
// @heroui/react's modal.js/alert-dialog.js). One that's animating out is already closed as far as
// the user is concerned, so it doesn't count.
const OPEN_MODAL_SELECTOR = [
  '[data-slot="modal-backdrop"]:not([data-exiting])',
  '[data-slot="alert-dialog-backdrop"]:not([data-exiting])',
  `[${APP_OVERLAY_ATTR}]`,
].join(', ')

// How many modal overlays are open right now, read from the DOM rather than from each overlay's own
// store, so a modal added later is covered without registering it anywhere. Used by the global
// keyboard shortcuts so they don't open something on top of, or change the page underneath, a
// modal the user is in the middle of. Only shortcuts check this - a modal opening another dialog
// from its own UI (Settings' multi-game farming notice, a confirm inside the Achievement Manager)
// is unaffected.
export const countOpenModals = () => document.querySelectorAll(OPEN_MODAL_SELECTOR).length

export const isAnyModalOpen = () => countOpenModals() > 0
