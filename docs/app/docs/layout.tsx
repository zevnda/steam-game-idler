import { baseOptions } from '../../lib/layout.shared'
import { source } from '../../lib/source'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import Image from 'next/image'
import { FaDiscord, FaGithub } from 'react-icons/fa6'

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const base = baseOptions()

  return (
    <DocsLayout
      {...base}
      tree={source.pageTree}
      links={[
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
            <Image src='/logo.svg' alt='Steam Game Idler' width={24} height={24} />
            <span className=''>Steam Game Idler</span>
          </>
        ),
      }}
    >
      {children}
    </DocsLayout>
  )
}
