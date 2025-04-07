import type { ReactElement } from 'react'

import { useUserContext } from '@/components/contexts/UserContext'
import Dashboard from '@/components/layout/Dashboard'
import Setup from '@/components/layout/Setup'
import ChangelogModal from '@/components/ui/ChangelogModal'
import SteamWarning from '@/components/ui/SteamWarning'
import useWindow from '@/hooks/layout/useWindow'

const test = 'test';
console.log(test);

export default function Window(): ReactElement {
  const { userSummary } = useUserContext()
  useWindow()

  if (!userSummary)
    return (
      <>
        <Setup />
        <ChangelogModal />
      </>
    )

  return (
    <div className='bg-titlebar min-h-calc'>
      <Dashboard />
      <SteamWarning />
      <ChangelogModal />
    </div>
  )
}
