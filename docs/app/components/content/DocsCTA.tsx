'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FaWindows } from 'react-icons/fa'
import { FiGithub } from 'react-icons/fi'

export default function DocsCTA() {
  const [installerUrl, setInstallerUrl] = useState<string>('')

  useEffect(() => {
    fetch('https://api.github.com/repos/steam-game-idler/steam-game-idler/releases/latest')
      .then(res => res.json())
      .then(data => {
        const installer = data.assets?.find((asset: { name: string }) => asset.name.endsWith('_x64-setup.exe'))
        if (installer) {
          setInstallerUrl(installer.browser_download_url)
        }
      })
      .catch(error => console.error('Failed to fetch latest release:', error))
  }, [])

  return (
    <div className='not-prose my-8'>
      <div className='rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/50'>
        <h3 className='mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100'>Ready to get started?</h3>

        <p className='mb-4 text-sm text-neutral-600 dark:text-neutral-400'>
          Join thousands of users who are already using Steam Game Idler to enhance their Steam experience.
        </p>

        <div className='flex flex-col sm:flex-row gap-3'>
          <Link
            prefetch={false}
            href={installerUrl || 'https://github.com/steam-game-idler/steam-game-idler/releases/latest'}
            className='inline-flex items-center justify-center px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 transition-colors dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200'
          >
            <FaWindows className='w-4 h-4 mr-2' />
            Download for Windows
          </Link>

          <Link
            prefetch={false}
            href='https://github.com/steam-game-idler/steam-game-idler'
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center justify-center px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-md hover:bg-neutral-100 transition-colors dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
          >
            <FiGithub className='w-4 h-4 mr-2' />
            View on GitHub
          </Link>
        </div>
      </div>
    </div>
  )
}
