import { invoke } from '@tauri-apps/api/core'
import { Trans, useTranslation } from 'react-i18next'
import { SiSteam, SiSteamdb } from 'react-icons/si'
import { TbAlertHexagonFilled, TbFoldersFilled, TbX } from 'react-icons/tb'
import { Alert, Button, cn } from '@heroui/react'
import { CustomTooltip } from '@/shared/components/CustomTooltip'
import { ExtLink } from '@/shared/components/ExtLink'
import { logEvent } from '@/shared/services/logService'
import { toast } from '@/shared/services/toastService'
import { useUiStore, useUserStore } from '@/shared/stores'

interface PageHeaderProps {
  protectedAchievements: boolean
  protectedStatistics: boolean
}

export function PageHeader({ protectedAchievements, protectedStatistics }: PageHeaderProps) {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const setAchievementsUnavailable = useUserStore(s => s.setAchievementsUnavailable)
  const setStatisticsUnavailable = useUserStore(s => s.setStatisticsUnavailable)
  const selectedGame = useUiStore(s => s.selectedGame)
  const setSelectedGame = useUiStore(s => s.setSelectedGame)
  const setAchievementQuery = useUiStore(s => s.setAchievementQuery)
  const setStatisticQuery = useUiStore(s => s.setStatisticQuery)
  const setCurrentTab = useUiStore(s => s.setCurrentTab)

  const handleClose = () => {
    setSelectedGame(null)
    setCurrentTab('achievements')
    setAchievementQuery('')
    setStatisticQuery('')
    setAchievementsUnavailable(true)
    setStatisticsUnavailable(true)
  }

  const handleOpenFile = async () => {
    try {
      await invoke('open_file_explorer', {
        path: `${userSummary?.steamId}\\achievement_data\\${selectedGame?.appid}.json`,
      })
    } catch (error) {
      toast.danger(t('common.error'))
      await logEvent(`[Error] in (handleOpenAchievementFile): ${error}`)
    }
  }

  return (
    <div className='relative flex justify-between items-center px-8'>
      <div className='flex items-center gap-3'>
        <Button
          isIconOnly
          radius='full'
          className='bg-item-hover text-content mt-2'
          startContent={<TbX />}
          onPress={handleClose}
        />
        <div className='mt-2'>
          <p className='text-3xl font-black'>{selectedGame?.name}</p>
          <p className='text-xs text-altwhite'>{selectedGame?.appid}</p>
        </div>
      </div>

      <div className='flex items-center gap-2'>
        {(protectedAchievements || protectedStatistics) && (
          <Alert
            color='warning'
            variant='faded'
            classNames={{
              base: '!bg-warning/20 !border-warning/40',
              iconWrapper: '!bg-warning/20 border-warning/40',
              description: 'font-bold text-xs',
            }}
            description={
              <Trans
                i18nKey='achievementManager.alert'
                components={{ 1: <span className='font-black text-warning' /> }}
              />
            }
          />
        )}
        <CustomTooltip content={t('achievementManager.file')}>
          <Button
            isIconOnly
            radius='full'
            className={cn('bg-item-hover text-content', !userSummary && 'hidden')}
            onPress={handleOpenFile}
            startContent={<TbFoldersFilled size={18} />}
          />
        </CustomTooltip>
        <ExtLink href={`https://store.steampowered.com/app/${selectedGame?.appid}`}>
          <Button
            isIconOnly
            radius='full'
            className='bg-item-hover text-content'
            startContent={<SiSteam size={18} />}
          />
        </ExtLink>
        <ExtLink href={`https://www.steamdb.info/app/${selectedGame?.appid}/stats/`}>
          <Button
            isIconOnly
            radius='full'
            className='bg-item-hover text-content'
            startContent={<SiSteamdb size={18} />}
          />
        </ExtLink>
        {(protectedAchievements || protectedStatistics) && (
          <CustomTooltip content={t('achievementManager.alert')} important>
            <TbAlertHexagonFilled size={20} className='text-warning' />
          </CustomTooltip>
        )}
      </div>
    </div>
  )
}
