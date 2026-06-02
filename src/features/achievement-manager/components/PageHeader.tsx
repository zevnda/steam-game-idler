import { invoke } from '@tauri-apps/api/core'
import { Trans, useTranslation } from 'react-i18next'
import { SiSteam, SiSteamdb } from 'react-icons/si'
import { TbFoldersFilled, TbX } from 'react-icons/tb'
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
    <div className='flex justify-between items-start px-6 py-4'>
      <div className='flex items-center gap-3'>
        <Button
          isIconOnly
          radius='full'
          size='sm'
          className='bg-card border border-border/20 text-altwhite hover:text-content shrink-0'
          startContent={<TbX size={16} />}
          onPress={handleClose}
        />
        <div>
          <p className='text-2xl font-black leading-tight'>{selectedGame?.name}</p>
          <p className='text-xs text-altwhite/60 mt-0.5'>{selectedGame?.appid}</p>
        </div>
      </div>

      <div className='flex items-center gap-2 mt-1'>
        {(protectedAchievements || protectedStatistics) && (
          <Alert
            color='warning'
            variant='faded'
            classNames={{
              base: '!bg-warning/10 !border-warning/30',
              iconWrapper: '!bg-warning/10 border-warning/30',
              description: 'font-semibold text-xs',
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
            size='sm'
            radius='full'
            className={cn(
              'bg-card border border-border/20 text-altwhite hover:text-content',
              !userSummary && 'hidden',
            )}
            onPress={handleOpenFile}
            startContent={<TbFoldersFilled size={16} />}
          />
        </CustomTooltip>
        <ExtLink href={`https://store.steampowered.com/app/${selectedGame?.appid}`}>
          <Button
            isIconOnly
            size='sm'
            radius='full'
            className='bg-card border border-border/20 text-altwhite hover:text-content'
            startContent={<SiSteam size={16} />}
          />
        </ExtLink>
        <ExtLink href={`https://www.steamdb.info/app/${selectedGame?.appid}/stats/`}>
          <Button
            isIconOnly
            size='sm'
            radius='full'
            className='bg-card border border-border/20 text-altwhite hover:text-content'
            startContent={<SiSteamdb size={16} />}
          />
        </ExtLink>
      </div>
    </div>
  )
}
