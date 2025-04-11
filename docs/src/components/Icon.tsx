import type { ReactElement } from 'react'

import { FiLogOut } from 'react-icons/fi'
import {
  TbAward,
  TbCards,
  TbCashRegister,
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

interface IconProps {
  type: IconType
}

export default function Icon({ type }: IconProps): ReactElement {
  const iconStyles = {
    display: 'inline',
    marginInline: 4,
    padding: 3,
    borderRadius: 4,
  }

  return (
    <>
      {type === 'game' && (
        <TbDeviceGamepad2 fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />
      )}
      {type === 'play' && (
        <TbPlayerPlay fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />
      )}
      {type === 'cards' && <TbCards fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />}
      {type === 'award' && <TbAward fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />}
      {type === 'hourglass' && (
        <TbHourglassLow fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />
      )}
      {type === 'heart' && <TbHeart fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />}
      {type === 'market' && (
        <TbCashRegister fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />
      )}
      {type === 'list-card' && (
        <TbPackageExport fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />
      )}
      {type === 'dollar' && (
        <TbCurrencyDollar fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />
      )}
      {type === 'gift' && <TbGift fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />}
      {type === 'playalt' && (
        <TbPlayerPlayFilled fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />
      )}
      {type === 'cog' && <TbSettings fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />}
      {type === 'dots' && (
        <TbDotsVertical fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />
      )}
      {type === 'signout' && (
        <FiLogOut fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white rotate-180' />
      )}
      {type === 'refresh' && (
        <TbRefresh fontSize={26} style={iconStyles} className='shadow-sm bg-[#1c79de] text-white' />
      )}
    </>
  )
}
