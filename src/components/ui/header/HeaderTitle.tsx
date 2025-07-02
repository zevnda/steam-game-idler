import type { ReactElement } from 'react'

import { useTranslation } from 'react-i18next'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useStateContext } from '@/components/contexts/StateContext'

export default function HeaderTitle(): ReactElement {
  const { t } = useTranslation()
  const { activePage, currentTab, currentSettingsTab } = useNavigationContext()
  const { showAchievements } = useStateContext()

  const formatTitleName: Record<string, string> = {
    'setup': t('setup.welcome'),
    'games': t('gamesList.title'),
    'idling': t('idlingGames.title'),
    'customlists/card-farming': t('common.cardFarming'),
    'customlists/achievement-unlocker': t('common.achievementUnlocker'),
    'customlists/auto-idle': t('customLists.autoIdle.title'),
    'customlists/favorites': t('customLists.favorites.title'),
    'freeGames': t('freeGames.title'),
    'tradingCards': t('tradingCards.title'),
    'settings': t('settings.title'),
    'general': t('settings.general.title'),
    'card-farming': t('common.cardFarming'),
    'achievement-unlocker': t('common.achievementUnlocker'),
    'trading-card-manager': t('tradingCards.title'),
    'logs': t('settings.logs.title'),
    'achievements': t('achievementManager.achievements.title'),
    'statistics': t('achievementManager.statistics.title'),
  }

  return (
    <div
      className='absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center gap-2'
      data-tauri-drag-region
    >
      <svg
        className='w-5 h-5 fill-dynamic pointer-events-none flex-shrink-0'
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 512 512'
        data-tauri-drag-region
      >
        <path d='M 142.00,84.14 C 142.00,84.14 199.00,84.14 199.00,84.14 199.00,84.14 307.00,84.14 307.00,84.14 325.10,84.00 364.25,82.67 380.00,85.96 390.72,88.20 409.37,96.67 418.56,102.64 434.31,112.88 450.88,130.75 459.87,147.27 463.14,153.29 466.00,159.57 468.34,166.00 468.34,166.00 471.01,174.57 471.01,174.57 473.97,178.67 479.87,175.56 487.00,178.33 491.82,180.20 494.21,182.15 497.70,185.92 504.85,193.64 505.98,197.58 506.00,208.00 506.00,208.00 506.00,304.00 506.00,304.00 505.99,308.30 505.98,311.76 504.55,315.91 502.38,322.21 493.71,330.80 487.57,333.33 479.89,336.49 474.44,333.01 470.93,338.14 470.93,338.14 465.86,351.72 465.86,351.72 462.50,359.95 457.71,368.17 452.76,375.58 435.36,401.62 407.21,419.36 377.00,426.33 369.30,428.11 366.11,428.99 358.00,429.00 358.00,429.00 200.00,429.00 200.00,429.00 200.00,429.00 153.00,429.00 153.00,429.00 131.70,428.97 110.41,419.90 92.71,408.67 92.71,408.67 84.28,403.28 84.28,403.28 69.92,391.91 56.64,376.07 48.55,359.58 48.55,359.58 40.07,338.14 40.07,338.14 36.70,333.21 31.73,336.26 24.29,333.65 18.06,331.47 9.26,322.92 6.79,316.83 5.22,312.96 5.02,309.10 5.00,305.00 5.00,305.00 5.00,208.00 5.00,208.00 5.02,197.58 6.15,193.64 13.30,185.92 16.79,182.15 19.18,180.20 24.00,178.33 31.13,175.56 37.03,178.67 39.99,174.57 39.99,174.57 42.66,166.00 42.66,166.00 44.73,160.32 48.55,151.53 51.68,146.43 51.68,146.43 65.23,126.66 65.23,126.66 65.23,126.66 75.92,116.25 75.92,116.25 89.86,103.60 98.13,97.83 115.93,91.17 115.93,91.17 130.00,86.17 130.00,86.17 130.00,86.17 142.00,84.14 142.00,84.14 Z M 156.00,148.09 C 148.00,149.47 142.36,151.09 135.00,154.54 115.64,163.61 101.10,184.40 101.00,206.00 101.00,206.00 101.00,269.00 101.00,269.00 101.00,279.92 100.16,307.78 102.20,316.83 105.00,329.26 113.80,341.73 123.42,349.84 129.89,355.29 140.54,361.32 149.00,362.57 149.00,362.57 157.96,363.13 157.96,363.13 162.49,363.68 161.30,364.90 168.00,365.00 168.00,365.00 197.00,365.00 197.00,365.00 197.00,365.00 341.00,365.00 341.00,365.00 350.67,364.98 347.54,363.79 353.04,363.13 357.82,362.55 361.23,363.33 366.72,361.60 372.22,359.88 377.19,356.95 382.00,353.85 394.65,345.67 404.62,332.29 408.59,317.72 410.54,310.53 410.00,298.72 410.00,291.00 410.00,291.00 410.00,247.00 410.00,247.00 410.00,247.00 410.00,207.00 410.00,207.00 409.95,173.50 380.67,148.05 348.00,148.09 348.00,148.09 222.00,148.09 222.00,148.09 222.00,148.09 156.00,148.09 156.00,148.09 Z M 167.00,208.43 C 188.68,205.75 208.99,211.66 220.04,232.00 225.56,242.16 227.01,261.85 223.19,272.83 218.67,285.82 203.91,300.66 190.00,302.83 175.17,305.14 158.88,304.45 146.89,294.23 142.48,290.47 135.58,281.94 133.14,276.71 122.38,253.62 131.99,224.55 154.58,212.97 159.96,210.22 160.98,209.47 167.00,208.43 Z M 324.00,208.43 C 344.64,205.88 362.53,210.82 374.41,229.02 387.12,248.51 383.75,274.03 367.87,290.58 362.09,296.60 354.32,301.40 346.00,302.85 324.41,306.63 304.93,301.33 292.53,282.20 285.84,271.86 285.87,263.84 286.00,252.00 286.26,230.02 302.58,212.14 324.00,208.43 Z' />
      </svg>

      <div className='flex justify-center items-center max-w-[500px]' data-tauri-drag-region>
        <p className='font-medium text-sm whitespace-nowrap text-content' data-tauri-drag-region>
          Steam Game Idler
          <span className='mx-1.5 text-dynamic/70 font-normal' data-tauri-drag-region>
            /
          </span>
        </p>

        <p className='font-medium text-sm truncate text-content/90' data-tauri-drag-region>
          {showAchievements && (
            <>
              <span className='whitespace-nowrap' data-tauri-drag-region>
                {t('achievementManager.title')}
                <span className='mx-1.5 text-dynamic/70 font-normal' data-tauri-drag-region>
                  /
                </span>
              </span>
              <span className='truncate' data-tauri-drag-region>
                {formatTitleName[currentTab]}
              </span>
            </>
          )}

          {!showAchievements && activePage === 'settings' && (
            <>
              <span className='whitespace-nowrap' data-tauri-drag-region>
                {t('settings.title')}
                <span className='mx-1.5 text-dynamic/70 font-normal' data-tauri-drag-region>
                  /
                </span>
              </span>
              <span className='truncate' data-tauri-drag-region>
                {formatTitleName[currentSettingsTab]}
              </span>
            </>
          )}

          {!showAchievements && activePage !== 'settings' && (
            <span className='truncate' data-tauri-drag-region>
              {formatTitleName[activePage]}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
