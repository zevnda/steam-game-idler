import { FaDiscord, FaGithub } from 'react-icons/fa6'
import { FiClock, FiEdit3 } from 'react-icons/fi'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import Image from 'next/image'
import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const base = baseOptions()

  return (
    <DocsLayout
      {...base}
      tree={source.pageTree}
      themeSwitch={{ enabled: false }}
      links={[
        // Blog and Changelog first: docs pages get most of the site's search traffic, so these
        // sidebar links are the main internal path from docs to both (the docs layout has no
        // marketing LandingNav). Same icons as the marketing footer uses for them.
        {
          type: 'icon',
          url: '/blog',
          label: 'Blog',
          text: 'Blog',
          icon: <FiEdit3 />,
        },
        {
          type: 'icon',
          url: '/changelog',
          label: 'Changelog',
          text: 'Changelog',
          icon: <FiClock />,
        },
        {
          type: 'icon',
          url: 'https://github.com/zevnda/steam-game-idler',
          label: 'github',
          text: 'Github',
          icon: <FaGithub />,
          external: true,
        },
        {
          type: 'icon',
          url: 'https://discord.com/invite/5kY2ZbVnZ8',
          label: 'discord',
          text: 'Discord',
          icon: <FaDiscord />,
          external: true,
        },
      ]}
      nav={{
        ...base.nav,
        title: (
          <>
            <Image src='/logo.png' alt='Steam Game Idler' width={24} height={24} loading='eager' />
            <span className='font-bold tracking-tight'>Steam Game Idler</span>
          </>
        ),
      }}
    >
      {children}
    </DocsLayout>
  )
}
