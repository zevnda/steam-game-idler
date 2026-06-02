import type { Game, InvokeSettings } from '@/shared/types'
import { invoke } from '@tauri-apps/api/core'
import { memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RiSearchLine } from 'react-icons/ri'
import { FixedSizeList as List } from 'react-window'
import { cn, Divider, Input, NumberInput } from '@heroui/react'
import Image from 'next/image'
import { useUserStore } from '@/shared/stores'

interface GameSettings {
  maxAchievementUnlocks?: number
  maxCardDrops?: number
  maxIdleTime?: number
  globalMaxIdleTime?: number
}

const Row = memo(
  ({
    index,
    style,
    data,
  }: {
    index: number
    style: React.CSSProperties
    data: { games: Game[]; selected: Game | null; onSelect: (g: Game) => void }
  }) => {
    const { games, selected, onSelect } = data
    const item = games[index]
    const isSelected = selected?.appid === item.appid
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      ;(e.target as HTMLImageElement).src = '/fallback.webp'
    }

    return (
      <div
        style={style}
        className={cn(
          'flex justify-between items-center gap-2 hover:bg-item-hover cursor-pointer px-3 py-1 duration-150 select-none',
          isSelected && 'bg-item-active',
        )}
        onClick={() => onSelect(item)}
      >
        <div className='flex items-center gap-2'>
          <Image
            src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${item.appid}/header.jpg`}
            className='aspect-62/29 rounded-sm'
            width={62}
            height={29}
            alt={`${item.name} image`}
            priority
            onError={handleImageError}
          />
          <p className='text-sm text-content truncate max-w-40'>{item.name}</p>
        </div>
      </div>
    )
  },
)

export function GameSettings() {
  const { t } = useTranslation()
  const userSummary = useUserStore(s => s.userSummary)
  const userSettings = useUserStore(s => s.userSettings)
  const setUserSettings = useUserStore(s => s.setUserSettings)
  const gamesList = useUserStore(s => s.gamesList)
  const [search, setSearch] = useState('')
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [gameSettings, setGameSettings] = useState<GameSettings>({})
  const [globalMax, setGlobalMax] = useState(0)

  useEffect(() => {
    setGlobalMax(
      typeof userSettings.gameSettings?.globalMaxIdleTime === 'number'
        ? userSettings.gameSettings.globalMaxIdleTime
        : 0,
    )
  }, [userSettings.gameSettings?.globalMaxIdleTime])

  useEffect(() => {
    if (!selectedGame) return
    const gs = userSettings.gameSettings?.[selectedGame.appid]
    if (typeof gs === 'object' && gs !== null && !Array.isArray(gs)) {
      setGameSettings(gs as GameSettings)
    } else {
      setGameSettings({})
    }
  }, [selectedGame, userSettings.gameSettings])

  const filtered = useMemo(() => {
    if (!search.trim()) return gamesList
    return gamesList.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
  }, [gamesList, search])

  const updateSetting = async (key: string, value: number | null) => {
    const res = await invoke<InvokeSettings>('update_user_settings', {
      steamId: userSummary?.steamId,
      key: `gameSettings.${key}`,
      value,
    })
    setUserSettings(res.settings)
  }

  return (
    <div className='relative flex flex-col gap-4 pb-16 w-full'>
      <div className='flex flex-col gap-0 select-none mb-3'>
        <p className='text-[10px] uppercase tracking-widest text-altwhite/40 font-black mb-1'>
          {t('settings.title')}
        </p>
        <p className='text-2xl font-black'>{t('common.gameSettings')}</p>
      </div>
      <div className='flex gap-6 mt-4'>
        <div className='flex flex-col gap-2 w-72 shrink-0'>
          <Input
            placeholder={t('common.search')}
            startContent={<RiSearchLine size={16} className='text-altwhite' />}
            classNames={{
              inputWrapper: cn('bg-input data-[hover=true]:!bg-inputhover rounded-lg'),
              input: ['!text-content placeholder:text-altwhite/50 text-sm'],
            }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className='border border-border/20 rounded-xl overflow-hidden'>
            <List
              height={400}
              itemCount={filtered.length}
              itemSize={50}
              width='100%'
              itemData={{ games: filtered, selected: selectedGame, onSelect: setSelectedGame }}
            >
              {Row}
            </List>
          </div>
        </div>
        {selectedGame ? (
          <div className='flex flex-col gap-4 flex-1'>
            <p className='text-lg font-bold truncate'>{selectedGame.name}</p>
            <Divider className='bg-border/15' />
            <div className='flex justify-between items-center'>
              <div className='flex flex-col gap-1'>
                <p className='text-sm text-content font-bold'>{t('gameSettings.idle')}</p>
                <p className='text-[11px] text-altwhite/60 leading-relaxed'>
                  {t('gameSettings.idleSub')}
                </p>
              </div>
              <NumberInput
                value={gameSettings.maxIdleTime ?? 0}
                minValue={0}
                step={1}
                className='w-32'
                classNames={{
                  inputWrapper: cn('bg-input data-[hover=true]:!bg-inputhover rounded-lg'),
                  input: ['!text-content'],
                }}
                onValueChange={v => updateSetting(`${selectedGame.appid}.maxIdleTime`, v || null)}
              />
            </div>
            <Divider className='bg-border/15' />
            <div className='flex justify-between items-center'>
              <div className='flex flex-col gap-1'>
                <p className='text-sm text-content font-bold'>{t('gameSettings.drops')}</p>
                <p className='text-[11px] text-altwhite/60 leading-relaxed'>
                  {t('gameSettings.dropsSub')}
                </p>
              </div>
              <NumberInput
                value={gameSettings.maxCardDrops ?? 0}
                minValue={0}
                step={1}
                className='w-32'
                classNames={{
                  inputWrapper: cn('bg-input data-[hover=true]:!bg-inputhover rounded-lg'),
                  input: ['!text-content'],
                }}
                onValueChange={v => updateSetting(`${selectedGame.appid}.maxCardDrops`, v || null)}
              />
            </div>
            <Divider className='bg-border/15' />
            <div className='flex justify-between items-center'>
              <div className='flex flex-col gap-1'>
                <p className='text-sm text-content font-bold'>{t('gameSettings.achievements')}</p>
                <p className='text-[11px] text-altwhite/60 leading-relaxed'>
                  {t('gameSettings.achievementsSub')}
                </p>
              </div>
              <NumberInput
                value={gameSettings.maxAchievementUnlocks ?? 0}
                minValue={0}
                step={1}
                className='w-32'
                classNames={{
                  inputWrapper: cn('bg-input data-[hover=true]:!bg-inputhover rounded-lg'),
                  input: ['!text-content'],
                }}
                onValueChange={v =>
                  updateSetting(`${selectedGame.appid}.maxAchievementUnlocks`, v || null)
                }
              />
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-4 flex-1'>
            <p className='text-lg font-bold'>{t('common.gameSettings')}</p>
            <Divider className='bg-border/15' />
            <div className='flex justify-between items-center'>
              <div className='flex flex-col gap-1'>
                <p className='text-sm text-content font-bold'>{t('gameSettings.globalMaxIdle')}</p>
                <p className='text-[11px] text-altwhite/60 leading-relaxed'>
                  {t('gameSettings.globalMaxIdleSub')}
                </p>
              </div>
              <NumberInput
                value={globalMax}
                minValue={0}
                step={1}
                className='w-32'
                classNames={{
                  inputWrapper: cn('bg-input data-[hover=true]:!bg-inputhover rounded-lg'),
                  input: ['!text-content'],
                }}
                onValueChange={v => {
                  setGlobalMax(v)
                  updateSetting('globalMaxIdleTime', v || null)
                }}
              />
            </div>
            <p className='text-sm text-altwhite'>{t('common.search')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
