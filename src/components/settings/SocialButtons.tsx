import type { ReactElement } from 'react'

import { useNavigationStore } from '@/stores/navigationStore'
import { FaDiscord, FaGithub } from 'react-icons/fa6'
import { TbBookFilled } from 'react-icons/tb'

import ExtLink from '@/components/ui/ExtLink'
import WebviewWindow from '@/components/ui/WebviewWindow'

export default function SocialButtons(): ReactElement {
  const currentSettingsTab = useNavigationStore(state => state.currentSettingsTab)

  return (
    <div className='flex items-center gap-1'>
      <WebviewWindow href={`https://steamgameidler.com/docs/settings/${currentSettingsTab}`}>
        <p className='bg-transparent rounded-full hover:bg-item-active p-2 duration-150'>
          <TbBookFilled size={20} />
        </p>
      </WebviewWindow>

      <ExtLink href='https://github.com/zevnda/steam-game-idler'>
        <p className='bg-transparent rounded-full hover:bg-item-active p-2 duration-150'>
          <FaGithub size={20} />
        </p>
      </ExtLink>

      <ExtLink href='https://discord.com/invite/eB3uRXZ3Am'>
        <p className='bg-transparent rounded-full hover:bg-item-active p-2 duration-150'>
          <FaDiscord size={20} />
        </p>
      </ExtLink>
    </div>
  )
}
