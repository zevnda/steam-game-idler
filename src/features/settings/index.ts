// Main Components
export { Settings } from './components/Settings'

// Main Hooks
export * from './hooks/useSettings'

// Main Utils
export { handleCheckboxChange } from './utils/handleCheckboxChange'

// Achievement Unlocker Feature
export { AchievementSettings } from './components/achievement-unlocker/AchievementSettings'
export * from './hooks/achievement-unlocker/useAchievementSettings'
export { handleSliderChange } from './utils/achievement-unlocker/handleSliderChange'
export { handleScheduleChange } from './utils/achievement-unlocker/handleScheduleChange'

// Card Farming Feature
export { CardSettings } from './components/card-farming/CardSettings'
export * from './hooks/card-farming/useCardSettings'
export { fetchUserSummary } from './utils/card-farming/fetchUserSummary'
export { getStoredSettings } from './utils/card-farming/getStoredSettings'
export { fetchGamesWithDropsData } from './utils/card-farming/fetchGamesWithDropsData'

// Customization Feature
export { CustomizationSettings } from './components/customization/CustomizationSettings'
export { handleThemeChange } from './utils/customization/handleThemeChange'
export * from './utils/customization/handleBackgroundChange'

// Debug Feature
export { ClearData } from './components/debug/ClearData'
export { ExportSettings } from './components/debug/ExportSettings'
export { Logs } from './components/debug/Logs'
export { OpenSettings } from './components/debug/OpenSettings'
export { ResetSettings } from './components/debug/ResetSettings'
export { useResetSettings } from './hooks/debug/useResetSettings'
export * from './hooks/debug/useLogs'
export { handleClearData } from './utils/debug/handleClearData'
export { handleOpenLogFile } from './utils/debug/handleOpenLogFile'
export { handleClearLogs } from './utils/debug/handleClearLogs'

// Free Games Feature
export { FreeGamesSettings } from './components/free-games/FreeGamesSettings'
export * from './utils/free-games/handleStoreLoginWindow'

// Game Settings Feature
export { GameSettings } from './components/game-settings/GameSettings'
export { useGameSettings } from './hooks/game-settings/useGameSettings'

// General Feature
export { GeneralSettings } from './components/general/GeneralSettings'
export { CurrencySwitch } from './components/general/CurrencySwitch'
export * from './hooks/general/useGeneralSettings'
export { handleRunAtStartupChange } from './utils/general/handleRunAtStartupChange'
export * from './utils/general/handleSteamWebAPIKey'

// Steam Credentials Feature
export { SteamCredentials } from './components/steam-credentials/SteamCredentials'
export * from './utils/steam-credentials/handleSteamCredentials'

// Trading Card Manager Feature
export { TradingCardManagerSettings } from './components/trading-card-manager/TradingCardManagerSettings'
export * from './utils/trading-card-manager/handleSettingsChange'
