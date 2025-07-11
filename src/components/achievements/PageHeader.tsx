import type { ReactElement } from 'react'

import { invoke } from '@tauri-apps/api/core'

import { Alert, Button, cn } from '@heroui/react'
import { Trans, useTranslation } from 'react-i18next'
import { SiSteam, SiSteamdb } from 'react-icons/si'
import { TbAlertHexagonFilled, TbFoldersFilled, TbX } from 'react-icons/tb'

import { useNavigationContext } from '@/components/contexts/NavigationContext'
import { useSearchContext } from '@/components/contexts/SearchContext'
import { useStateContext } from '@/components/contexts/StateContext'
import { useUserContext } from '@/components/contexts/UserContext'
import CustomTooltip from '@/components/ui/CustomTooltip'
import ExtLink from '@/components/ui/ExtLink'
import { logEvent } from '@/utils/tasks'
import { showDangerToast } from '@/utils/toasts'

interface PageHeaderProps {
  protectedAchievements: boolean
  protectedStatistics: boolean
}

export default function PageHeader({ protectedAchievements, protectedStatistics }: PageHeaderProps): ReactElement {
  const { t } = useTranslation()
  const { userSummary, setAchievementsUnavailable, setStatisticsUnavailable } = useUserContext()
  const { appId, appName, setShowAchievements } = useStateContext()
  const { setAchievementQueryValue, setStatisticQueryValue } = useSearchContext()
  const { setCurrentTab } = useNavigationContext()

  const handleClick = (): void => {
    setShowAchievements(false)
    setCurrentTab('achievements')
    setAchievementQueryValue('')
    setStatisticQueryValue('')
    setAchievementsUnavailable(true)
    setStatisticsUnavailable(true)
  }

  const handleOpenAchievementFile = async (): Promise<void> => {
    try {
      const filePath = `cache\\${userSummary?.steamId}\\achievement_data\\${appId}.json`
      await invoke('open_file_explorer', { path: filePath })
    } catch (error) {
      showDangerToast(t('common.error'))
      console.error('Error in (handleOpenLogFile):', error)
      logEvent(`[Error] in (handleOpenLogFile): ${error}`)
    }
  }

  return (
    <div className='relative flex justify-between items-center px-10'>
      <div className='flex items-center gap-3'>
        <Button
          isIconOnly
          radius='full'
          className='bg-item-hover/80 text-btn-alt'
          startContent={<TbX />}
          onPress={handleClick}
        />

        <div className='w-[320px]'>
          <p className='text-3xl font-black truncate'>{appName}</p>
        </div>

        <div className='flex items-center gap-1 w-full'>
          <CustomTooltip content={t('achievementManager.steam')} placement='top'>
            <div>
              <ExtLink href={`https://steamcommunity.com/stats/${appId}/achievements/`}>
                <div className='bg-item-hover/60 hover:bg-item-active/60 rounded-full p-2 cursor-pointer duration-200'>
                  <SiSteam fontSize={18} />
                </div>
              </ExtLink>
            </div>
          </CustomTooltip>

          <CustomTooltip content={t('achievementManager.steamDB')} placement='top'>
            <div>
              <ExtLink href={`https://steamdb.info/app/${appId}/stats/`}>
                <div className='bg-item-hover/60 hover:bg-item-active/60 rounded-full p-2 cursor-pointer duration-200'>
                  <SiSteamdb fontSize={18} />
                </div>
              </ExtLink>
            </div>
          </CustomTooltip>

          <CustomTooltip content={t('achievementManager.file')} placement='top'>
            <div>
              <div
                className='bg-item-hover/60 hover:bg-item-active/60 rounded-full p-2 cursor-pointer duration-200'
                onClick={handleOpenAchievementFile}
              >
                <TbFoldersFilled fontSize={18} />
              </div>
            </div>
          </CustomTooltip>
        </div>
      </div>

      {(protectedAchievements || protectedStatistics) && (
        <div className='absolute top-0 right-0 pr-7'>
          <Alert
            hideIcon
            title={
              <p>
                <Trans i18nKey='achievementManager.alert'>
                  Some protected achievements or statistics have been disabled.
                  <ExtLink
                    className='text-dynamic hover:text-dynamic-hover duration-150'
                    href='https://partner.steamgames.com/doc/features/achievements#game_server_stats:~:text=Stats%20and%20achievements%20that%20are%20settable%20by%20game%20servers%20cannot%20be%20set%20by%20clients.'
                  >
                    <span> Learn more</span>
                  </ExtLink>
                </Trans>
              </p>
            }
            startContent={<TbAlertHexagonFilled fontSize={22} className='text-warning' />}
            classNames={{
              base: cn('!bg-base/60 h-10 py-1 flex justify-center items-center gap-0', 'rounded-lg text-content'),
              title: ['text-sm'],
            }}
          />
        </div>
      )}
    </div>
  )
}
