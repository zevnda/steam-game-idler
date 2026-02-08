// Main Components
export { Settings } from './Settings'
export { SettingsSwitch } from './SettingsSwitch'
export { SocialButtons } from './SocialButtons'

// Main Hooks
export * from './hooks/useSettings'

// Main Utils
export { handleCheckboxChange } from './utils/handleCheckboxChange'

// Achievement Unlocker Feature
export { AchievementSettings } from './achievement-unlocker/AchievementSettings'
export * from './achievement-unlocker/hooks/useAchievementSettings'
export { handleSliderChange } from './achievement-unlocker/utils/handleSliderChange'
export { handleScheduleChange } from './achievement-unlocker/utils/handleScheduleChange'

// Card Farming Feature
export { CardSettings } from './card-farming/CardSettings'
export * from './card-farming/hooks/useCardSettings'
export { fetchUserSummary } from './card-farming/utils/fetchUserSummary'
export { getStoredSettings } from './card-farming/utils/getStoredSettings'
export { fetchGamesWithDropsData } from './card-farming/utils/fetchGamesWithDropsData'

// Customization Feature
export { CustomizationSettings } from './customization/CustomizationSettings'
export { handleThemeChange } from './customization/utils/handleThemeChange'
export * from './customization/utils/handleBackgroundChange'

// Debug Feature
export { ClearData } from './debug/ClearData'
export { ExportSettings } from './debug/ExportSettings'
export { Logs } from './debug/Logs'
export { OpenSettings } from './debug/OpenSettings'
export { ResetSettings } from './debug/ResetSettings'
export { useResetSettings } from './debug/hooks/useResetSettings'
export * from './debug/hooks/useLogs'
export { handleClearData } from './debug/utils/handleClearData'
export { handleOpenLogFile } from './debug/utils/handleOpenLogFile'
export { handleClearLogs } from './debug/utils/handleClearLogs'

// Free Games Feature
export { FreeGamesSettings } from './free-games/FreeGamesSettings'
export * from './free-games/utils/handleStoreLoginWindow'

// Game Settings Feature
export { GameSettings } from './game-settings/GameSettings'
export { useGameSettings } from './game-settings/hooks/useGameSettings'

// General Feature
export { GeneralSettings } from './general/GeneralSettings'
export { CurrencySwitch } from './general/CurrencySwitch'
export * from './general/hooks/useGeneralSettings'
export { handleRunAtStartupChange } from './general/utils/handleRunAtStartupChange'
export * from './general/utils/handleSteamWebAPIKey'

// Steam Credentials Feature
export { SteamCredentials } from './steam-credentials/SteamCredentials'
export * from './steam-credentials/utils/handleSteamCredentials'

// Trading Card Manager Feature
export { TradingCardManagerSettings } from './trading-card-manager/TradingCardManagerSettings'
export * from './trading-card-manager/utils/handleSettingsChange'
