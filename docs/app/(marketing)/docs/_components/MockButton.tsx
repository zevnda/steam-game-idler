import { FaCheck } from 'react-icons/fa'
import { FaPaypal, FaSteam, FaStripe } from 'react-icons/fa6'
import { GoGrabber } from 'react-icons/go'
import {
  TbArrowRight,
  TbArrowsSort,
  TbAward,
  TbBan,
  TbBuildingStore,
  TbCards,
  TbCopy,
  TbDeviceGamepad2,
  TbExternalLink,
  TbGift,
  TbHeart,
  TbHourglassLow,
  TbLock,
  TbLockOpen,
  TbLogout2,
  TbPackageExport,
  TbPlayerPlay,
  TbPlayerPlayFilled,
  TbPlayerStopFilled,
  TbPlus,
  TbRefresh,
  TbSettings,
  TbTrophyFilled,
  TbUpload,
  TbUserCircle,
} from 'react-icons/tb'

type ButtonType =
  | 'content'
  | 'unlock'
  | 'lock'
  | 'unlock-all'
  | 'lock-all'
  | 'all-games'
  | 'card-farming'
  | 'card-farming-action'
  | 'achievement-unlocker'
  | 'achievement-unlocker-action'
  | 'achievement-manager'
  | 'list-card'
  | 'list-selected'
  | 'list-all'
  | 'remove-all'
  | 'save'
  | 'save-alt'
  | 'save-changes'
  | 'context-add'
  | 'context-cog'
  | 'your-games'
  | 'inventory-manager'
  | 'idling-games'
  | 'auto-idle'
  | 'free-games'
  | 'unlock-order'
  | 'grabber'
  | 'favorites'
  | 'start-idle'
  | 'steam'
  | 'start-manually'
  | 'checkbox'
  | 'import-timings'
  | 'sell-dupes'
  | 'steam-sign-in'
  | 'legacy-sign-in'
  | 'qr-sign-in'
  | 'continue'
  | 'account-switcher'
  | 'add-account'
  | 'sign-out'
  | 'manage-subscription'
  | 'upgrade'
  | 'activate'
  | 'copy'
  | 'clear'
  | 'view-log-file'
  | 'open-settings-file'
  | 'export-settings'
  | 'clear-logs'
  | 'reset-settings'
  | 'clear-data'
  | 'stop'
  | 'stop-all'
  | 'go-pro'
  | 'pay-stripe'
  | 'pay-paypal'
  | 'blacklist'
  | 'refresh'

interface MockButtonProps {
  type: ButtonType
  content?: string
}

export default function MockButton({ type, content }: MockButtonProps) {
  if (type === 'content') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        {content}
      </span>
    )
  } else if (type === 'lock') {
    return (
      <span className='inline-flex align-middle items-center justify-center text-icon-dark bg-red-500 text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbLock fontSize={16} className='inline' /> Lock
      </span>
    )
  } else if (type === 'lock-all') {
    return (
      <span className='inline-flex align-middle items-center justify-center text-icon-dark bg-red-500 text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbLock fontSize={16} className='inline' /> Lock All
      </span>
    )
  } else if (type === 'remove-all') {
    return (
      <span className='inline bg-red-500 text-white text-[12px] font-semibold px-2 py-1.5 rounded-full shadow-sm select-none'>
        Remove listings
      </span>
    )
  } else if (type === 'unlock') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbLockOpen fontSize={16} className='inline' /> Unlock
      </span>
    )
  } else if (type === 'unlock-all') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbLockOpen fontSize={16} className='inline' /> Unlock All
      </span>
    )
  } else if (type === 'all-games') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        All Games
      </span>
    )
  } else if (type === 'card-farming') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbCards fontSize={16} className='inline' /> Card Farming
      </span>
    )
  } else if (type === 'card-farming-action') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbPlayerPlayFilled fontSize={16} className='inline' /> Start
      </span>
    )
  } else if (type === 'achievement-unlocker') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbAward fontSize={16} className='inline' /> Achievement Unlocker
      </span>
    )
  } else if (type === 'achievement-unlocker-action') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbPlayerPlayFilled fontSize={16} className='inline' /> Start
      </span>
    )
  } else if (type === 'achievement-manager') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1 h-8'>
        <TbTrophyFilled fontSize={16} className='inline' />
      </span>
    )
  } else if (type === 'list-card') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1 h-8'>
        <TbPackageExport fontSize={16} className='inline' />
      </span>
    )
  } else if (type === 'list-selected') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Sell Selected
      </span>
    )
  } else if (type === 'list-all') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Sell All
      </span>
    )
  } else if (type === 'save') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbUpload fontSize={16} className='inline' /> Save
      </span>
    )
  } else if (type === 'save-alt') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Save
      </span>
    )
  } else if (type === 'save-changes') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbUpload fontSize={16} className='inline' /> Save Changes
      </span>
    )
  } else if (type === 'context-add') {
    return (
      <span
        className={`inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1 ${content === undefined && 'h-8'}`}
      >
        <TbPlus fontSize={16} className='inline' /> {content}
      </span>
    )
  } else if (type === 'context-cog') {
    return (
      <span
        className={`inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1 ${content === undefined && 'h-8'}`}
      >
        <TbSettings fontSize={16} className='inline' /> {content}
      </span>
    )
  } else if (type === 'refresh') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1 h-8'>
        <TbRefresh fontSize={16} className='inline' />
      </span>
    )
  } else if (type === 'your-games') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbDeviceGamepad2 fontSize={16} className='inline' /> Games
      </span>
    )
  } else if (type === 'inventory-manager') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbBuildingStore fontSize={16} className='inline' /> Inventory Manager
      </span>
    )
  } else if (type === 'idling-games') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbPlayerPlay fontSize={16} className='inline' /> Idling
      </span>
    )
  } else if (type === 'auto-idle') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbHourglassLow fontSize={16} className='inline' /> Automatic Idler
      </span>
    )
  } else if (type === 'free-games') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbGift fontSize={16} className='inline' /> Free Games
      </span>
    )
  } else if (type === 'unlock-order') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1 h-8'>
        <TbArrowsSort fontSize={16} className='inline' />
      </span>
    )
  } else if (type === 'grabber') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-1 rounded-full shadow-sm select-none gap-1 h-8'>
        <GoGrabber fontSize={24} className='inline' />
      </span>
    )
  } else if (type === 'favorites') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbHeart fontSize={16} className='inline' /> Favorites
      </span>
    )
  } else if (type === 'start-idle') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1 h-8'>
        <TbPlayerPlayFilled fontSize={16} className='inline' />
      </span>
    )
  } else if (type === 'steam') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1 h-8'>
        <FaSteam fontSize={16} className='inline' />
      </span>
    )
  } else if (type === 'start-manually') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbPlayerPlayFilled fontSize={16} className='inline' /> Start
      </span>
    )
  } else if (type === 'import-timings') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Import Timings
      </span>
    )
  } else if (type === 'checkbox') {
    return (
      <span className='inline-flex align-middle items-center justify-center w-5 h-5 rounded-md text-white bg-blue-500 border border-border'>
        <span className='w-3 h-3 block'>
          <FaCheck fontSize={12} />
        </span>
      </span>
    )
  } else if (type === 'sell-dupes') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbCopy fontSize={16} className='inline' /> Sell Dupes
      </span>
    )
  } else if (type === 'steam-sign-in') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Steam Sign-in
      </span>
    )
  } else if (type === 'legacy-sign-in') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Legacy Sign-in
      </span>
    )
  } else if (type === 'qr-sign-in') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Or sign in with QR
      </span>
    )
  } else if (type === 'continue') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbArrowRight fontSize={16} className='inline' /> Continue
      </span>
    )
  } else if (type === 'account-switcher') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1 h-8'>
        <TbUserCircle fontSize={16} className='inline' />
      </span>
    )
  } else if (type === 'add-account') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbPlus fontSize={16} className='inline' /> Add another account
      </span>
    )
  } else if (type === 'blacklist') {
    return (
      <span
        className={`inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1 ${content === undefined && 'h-8'}`}
      >
        <TbBan fontSize={16} className='inline' /> {content}
      </span>
    )
  } else if (type === 'sign-out') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbLogout2 fontSize={16} className='inline' /> Sign out
      </span>
    )
  } else if (type === 'manage-subscription') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Manage subscription <TbExternalLink fontSize={14} className='inline' />
      </span>
    )
  } else if (type === 'upgrade') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Upgrade
      </span>
    )
  } else if (type === 'activate') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Activate
      </span>
    )
  } else if (type === 'copy') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbCopy fontSize={16} className='inline' /> Copy
      </span>
    )
  } else if (type === 'clear') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Clear
      </span>
    )
  } else if (type === 'view-log-file') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        View log file
      </span>
    )
  } else if (type === 'open-settings-file') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Open settings file
      </span>
    )
  } else if (type === 'export-settings') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Export settings
      </span>
    )
  } else if (type === 'clear-logs') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Clear logs
      </span>
    )
  } else if (type === 'reset-settings') {
    return (
      <span className='inline-flex align-middle items-center justify-center text-icon-dark bg-red-500 text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Reset settings
      </span>
    )
  } else if (type === 'clear-data') {
    return (
      <span className='inline-flex align-middle items-center justify-center text-icon-dark bg-red-500 text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        Clear data
      </span>
    )
  } else if (type === 'stop') {
    return (
      <span className='inline-flex align-middle items-center justify-center text-icon-dark bg-red-500 text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbPlayerStopFilled fontSize={16} className='inline' /> Stop
      </span>
    )
  } else if (type === 'stop-all') {
    return (
      <span className='inline-flex align-middle items-center justify-center text-icon-dark bg-red-500 text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <TbPlayerStopFilled fontSize={16} className='inline' /> Stop all
      </span>
    )
  } else if (type === 'go-pro') {
    return (
      <span
        className='inline-flex align-middle items-center justify-center bg-white text-[11px] font-black uppercase italic px-2 rounded-full shadow-sm select-none'
        style={{ color: '#0092d0' }}
      >
        Go Pro
      </span>
    )
  } else if (type === 'pay-stripe') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <FaStripe fontSize={20} className='inline' /> Stripe
      </span>
    )
  } else if (type === 'pay-paypal') {
    return (
      <span className='inline-flex align-middle items-center justify-center bg-fd-muted text-[12px] font-semibold px-2 rounded-full shadow-sm select-none gap-1'>
        <FaPaypal fontSize={16} className='inline' /> PayPal
      </span>
    )
  }

  return null
}
