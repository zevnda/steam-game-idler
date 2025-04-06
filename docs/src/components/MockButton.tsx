import type { ReactElement } from 'react'

import { TbAward, TbCards, TbEdit, TbPlus, TbSettings } from 'react-icons/tb'

type ButtonType =
  | 'unlock'
  | 'lock'
  | 'unlock-all'
  | 'lock-all'
  | 'edit'
  | 'card-farming'
  | 'achievement-unlocker'
  | 'done'
  | 'save'
  | 'save-changes'
  | 'context-add'
  | 'context-cog'

interface MockButtonProps {
  type: ButtonType
  content?: string
}

export default function MockButton({ type, content }: MockButtonProps): ReactElement | null {
  if (type === 'unlock') {
    return (
      <span className='inline bg-[#eff4f7] text-black text-[10px] font-semibold px-1 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        Unlock
      </span>
    )
  } else if (type === 'lock') {
    return (
      <span className='inline bg-red-500 text-white text-[10px] font-semibold px-1 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        Lock
      </span>
    )
  } else if (type === 'unlock-all') {
    return (
      <span className='inline bg-[#eff4f7] text-black text-[10px] font-semibold px-1 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        Unlock All
      </span>
    )
  } else if (type === 'lock-all') {
    return (
      <span className='inline bg-red-500 text-white text-[10px] font-semibold px-1 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        Lock All
      </span>
    )
  } else if (type === 'edit') {
    return (
      <span className='inline bg-[#eff4f7] text-black text-[10px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbEdit fontSize={14} className='inline' /> Edit List
      </span>
    )
  } else if (type === 'card-farming') {
    return (
      <span className='inline bg-[#eff4f7] text-black text-[10px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbCards fontSize={14} className='inline' /> Start Card Farming
      </span>
    )
  } else if (type === 'achievement-unlocker') {
    return (
      <span className='inline bg-[#eff4f7] text-black text-[10px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbAward fontSize={14} className='inline' /> Start Achievement Unlocker
      </span>
    )
  } else if (type === 'done') {
    return (
      <span className='inline bg-[#eff4f7] text-black text-[10px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        Done
      </span>
    )
  } else if (type === 'save') {
    return (
      <span className='inline bg-[#eff4f7] text-black text-[10px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        Save
      </span>
    )
  } else if (type === 'save-changes') {
    return (
      <span className='inline bg-[#eff4f7] text-black text-[10px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        Save Changes
      </span>
    )
  } else if (type === 'context-add') {
    return (
      <span className='inline bg-[#eff4f7] text-black text-[10px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbPlus fontSize={14} className='inline' /> {content}
      </span>
    )
  } else if (type === 'context-cog') {
    return (
      <span className='inline bg-[#eff4f7] text-black text-[10px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbSettings fontSize={14} className='inline' /> {content}
      </span>
    )
  }

  return null
}
