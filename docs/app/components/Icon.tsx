import type { ReactElement } from 'react'

import { FaSteam } from 'react-icons/fa'
import { FiLogOut } from 'react-icons/fi'
import {
  TbAwardFilled,
  TbBuildingStore,
  TbCards,
  TbCurrencyDollar,
  TbDeviceGamepad2,
  TbDotsVertical,
  TbGift,
  TbHeart,
  TbHourglassLow,
  TbPackageExport,
  TbPlayerPlay,
  TbPlayerPlayFilled,
  TbRefresh,
  TbSettings,
} from 'react-icons/tb'

type IconType =
  | 'game'
  | 'play'
  | 'cards'
  | 'award'
  | 'hourglass'
  | 'heart'
  | 'market'
  | 'list-card'
  | 'dollar'
  | 'gift'
  | 'playalt'
  | 'cog'
  | 'dots'
  | 'signout'
  | 'refresh'
  | 'steam'

interface IconProps {
  type: IconType
}

export default function Icon({ type }: IconProps): ReactElement {
  const iconStyles = {
    display: 'inline',
    marginInline: 4,
    padding: 3,
    borderRadius: 100,
  }

  return (
    <>
      {type === 'game' && (
        <TbDeviceGamepad2
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'play' && (
        <TbPlayerPlay
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'cards' && (
        <TbCards
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'award' && (
        <TbAwardFilled
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'hourglass' && (
        <TbHourglassLow
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'heart' && (
        <TbHeart
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'market' && (
        <TbBuildingStore
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'list-card' && (
        <TbPackageExport
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'dollar' && (
        <TbCurrencyDollar
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'gift' && (
        <TbGift
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'playalt' && (
        <TbPlayerPlayFilled
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'cog' && (
        <TbSettings
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'dots' && (
        <TbDotsVertical
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'signout' && (
        <FiLogOut
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark rotate-180'
        />
      )}

      {type === 'refresh' && (
        <TbRefresh
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}

      {type === 'steam' && (
        <FaSteam
          fontSize={26}
          style={iconStyles}
          className='shadow-sm bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark'
        />
      )}
    </>
  )
}
