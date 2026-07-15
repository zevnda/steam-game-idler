import { create } from 'zustand'

// Order matches `main`'s settings-screen category order - most members currently render as a
// pending placeholder in SettingsModal.tsx until their underlying feature exists.
export type SettingsTab =
  | 'general'
  | 'subscription'
  | 'customization'
  | 'steamCredentials'
  | 'cardFarming'
  | 'achievementUnlocker'
  | 'inventoryManager'
  | 'freeGames'
  | 'gameSettings'
  | 'keybinds'
  | 'debug'

interface SettingsModalStore {
  isOpen: boolean
  activeTab: SettingsTab
  open: (tab?: SettingsTab) => void
  close: () => void
  setActiveTab: (tab: SettingsTab) => void
}

// Own dedicated store, fully decoupled from routing/navigation. Opening settings never hijacks a
// page slot the way `main`'s `navigationStore` treats `activePage === 'settings'`; the page
// underneath just stays mounted untouched. `activeTab` now covers every category `main` has (most
// render as a pending placeholder) - flipping a pending category to real content is just swapping
// its `TabPanel` body in SettingsModal.tsx, no restructuring here, same pattern
// Sidebar.tsx's data-driven `sections` array already established. `open` takes an optional tab so a
// feature page's own settings-gear button (e.g. achievement-unlocker's) can jump straight to its
// category instead of whatever tab was last active - the sidebar's plain Settings button still
// calls `open()` with no argument, which keeps the current tab.
export const useSettingsModalStore = create<SettingsModalStore>((set, get) => ({
  isOpen: false,
  activeTab: 'general',
  open: tab => set({ isOpen: true, activeTab: tab ?? get().activeTab }),
  close: () => set({ isOpen: false, activeTab: 'general' }),
  setActiveTab: tab => set({ activeTab: tab }),
}))
