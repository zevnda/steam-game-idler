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
        <TbDeviceGamepad2 fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />
      )}
      {type === 'play' && (
        <TbPlayerPlay fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />
      )}
      {type === 'cards' && <TbCards fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />}
      {type === 'award' && <TbAward fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />}
      {type === 'hourglass' && (
        <TbHourglassLow fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />
      )}
      {type === 'heart' && <TbHeart fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />}
      {type === 'market' && (
        <TbCashRegister fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />
      )}
      {type === 'dollar' && (
        <TbCurrencyDollar fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />
      )}
      {type === 'gift' && <TbGift fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />}
      {type === 'playalt' && (
        <TbPlayerPlayFilled fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />
      )}
      {type === 'cog' && <TbSettings fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />}
      {type === 'dots' && (
        <TbDotsVertical fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />
      )}
      {type === 'signout' && (
        <FiLogOut fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black rotate-180' />
      )}
      {type === 'refresh' && (
        <TbRefresh fontSize={24} style={iconStyles} className='shadow-sm bg-[#eff4f7] text-black' />
      )}
    </>
  )
}
