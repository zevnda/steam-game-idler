import type { ReactElement } from 'react'

import {
  TbAward,
  TbBuildingStore,
  TbCards,
  TbChecks,
  TbDeviceGamepad2,
  TbEdit,
  TbEraser,
  TbGift,
  TbHourglassLow,
  TbLock,
  TbLockOpen,
  TbPackageExport,
  TbPlayerPlay,
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
  | 'card-farming-action'
  | 'achievement-unlocker'
  | 'achievement-unlocker-action'
  | 'list-cards'
  | 'sell'
  | 'sell-all'
  | 'remove-all'
  | 'done'
  | 'save'
  | 'save-changes'
  | 'context-add'
  | 'context-cog'
  | 'your-games'
  | 'statistics-tab'
  | 'trading-card-manager'
  | 'refresh'
  | 'idling-games'
  | 'auto-idle'
  | 'free-games'

interface MockButtonProps {
  type: ButtonType
  content?: string
}

export default function MockButton({ type, content }: MockButtonProps): ReactElement | null {
  if (type === 'unlock') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbLockOpen fontSize={20} className='inline' /> Unlock
      </span>
    )
  } else if (type === 'lock') {
    return (
      <span className='inline bg-red-500 text-white text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbLock fontSize={20} className='inline' /> Lock
      </span>
    )
  } else if (type === 'unlock-all') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbLockOpen fontSize={20} className='inline' /> Unlock All
      </span>
    )
  } else if (type === 'lock-all') {
    return (
      <span className='inline bg-red-500 text-white text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbLock fontSize={20} className='inline' /> Lock All
      </span>
    )
  } else if (type === 'edit') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbEdit fontSize={20} className='inline' /> Edit List
      </span>
    )
  } else if (type === 'card-farming') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbCards fontSize={20} className='inline' /> Card Farming
      </span>
    )
  } else if (type === 'card-farming-action') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbCards fontSize={20} className='inline' /> Start Card Farming
      </span>
    )
  } else if (type === 'achievement-unlocker') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbAward fontSize={20} className='inline' /> Achievement Unlocker
      </span>
    )
  } else if (type === 'achievement-unlocker-action') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbAward fontSize={20} className='inline' /> Start Achievement Unlocker
      </span>
    )
  } else if (type === 'list-cards') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbChecks fontSize={20} className='inline' /> List Selected
      </span>
    )
  } else if (type === 'sell-all') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbPackageExport fontSize={20} className='inline' /> List All
      </span>
    )
  } else if (type === 'remove-all') {
    return (
      <span className='inline bg-red-500 text-white text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbEraser fontSize={20} className='inline' /> Remove All
      </span>
    )
  } else if (type === 'done') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        Done
      </span>
    )
  } else if (type === 'save') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbUpload fontSize={20} className='inline' /> Save
      </span>
    )
  } else if (type === 'save-changes') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbUpload fontSize={20} className='inline' /> Save Changes
      </span>
    )
  } else if (type === 'context-add') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbPlus fontSize={20} className='inline' /> {content}
      </span>
    )
  } else if (type === 'context-cog') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbSettings fontSize={20} className='inline' /> {content}
      </span>
    )
  } else if (type === 'your-games') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbDeviceGamepad2 fontSize={20} className='inline' /> Your Games
      </span>
    )
  } else if (type === 'statistics-tab') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        Statistics
      </span>
    )
  } else if (type === 'trading-card-manager') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbBuildingStore fontSize={20} className='inline' /> Trading Card Manager
      </span>
    )
  } else if (type === 'refresh') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        Refresh
      </span>
    )
  } else if (type === 'idling-games') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbPlayerPlay fontSize={20} className='inline' /> Idling Games
      </span>
    )
  } else if (type === 'auto-idle') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbHourglassLow fontSize={20} className='inline' /> Automatic Idler
      </span>
    )
  } else if (type === 'free-games') {
    return (
      <span className='inline bg-icon-light dark:bg-icon-dark text-icon-light dark:text-icon-dark text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        <TbGift fontSize={20} className='inline' /> Free Games
      </span>
    )
  }

  return null
}
