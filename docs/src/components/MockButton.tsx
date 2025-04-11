import type { ReactElement } from 'react'

import {
  TbAward,
  TbCards,
  TbChecks,
  TbEdit,
  TbEraser,
  TbLock,
  TbLockOpen,
  TbPackageExport,
  TbPlus,
  TbSettings,
  TbUpload,
} from 'react-icons/tb'

type ButtonType =
  | 'unlock'
  | 'lock'
  | 'unlock-all'
  | 'lock-all'
  | 'edit'
  | 'card-farming'
  | 'achievement-unlocker'
  | 'list-cards'
  | 'sell'
  | 'sell-all'
  | 'remove-all'
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
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbLockOpen fontSize={20} className='inline' /> Unlock
      </span>
    )
  } else if (type === 'lock') {
    return (
      <span className='inline bg-red-500 text-white text-[12px] font-semibold px-1 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbLock fontSize={20} className='inline' /> Lock
      </span>
    )
  } else if (type === 'unlock-all') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbLockOpen fontSize={20} className='inline' /> Unlock All
      </span>
    )
  } else if (type === 'lock-all') {
    return (
      <span className='inline bg-red-500 text-white text-[12px] font-semibold px-1 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbLock fontSize={20} className='inline' /> Lock All
      </span>
    )
  } else if (type === 'edit') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbEdit fontSize={20} className='inline' /> Edit List
      </span>
    )
  } else if (type === 'card-farming') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbCards fontSize={20} className='inline' /> Start Card Farming
      </span>
    )
  } else if (type === 'achievement-unlocker') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbAward fontSize={20} className='inline' /> Start Achievement Unlocker
      </span>
    )
  } else if (type === 'list-cards') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbChecks fontSize={20} className='inline' /> List Selected
      </span>
    )
  } else if (type === 'sell-all') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbPackageExport fontSize={20} className='inline' /> List All
      </span>
    )
  } else if (type === 'remove-all') {
    return (
      <span className='inline bg-red-500 text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbEraser fontSize={20} className='inline' /> Remove All
      </span>
    )
  } else if (type === 'done') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        Done
      </span>
    )
  } else if (type === 'save') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbUpload fontSize={20} className='inline' /> Save
      </span>
    )
  } else if (type === 'save-changes') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbUpload fontSize={20} className='inline' /> Save Changes
      </span>
    )
  } else if (type === 'context-add') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbPlus fontSize={20} className='inline' /> {content}
      </span>
    )
  } else if (type === 'context-cog') {
    return (
      <span className='inline bg-[#1c79de] text-white text-[12px] font-semibold px-1.5 py-1.5 rounded-sm shadow-sm select-none mx-1'>
        <TbSettings fontSize={20} className='inline' /> {content}
      </span>
    )
  }

  return null
}
