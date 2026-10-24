import { FaDiscord, FaGithub } from 'react-icons/fa6'

// `group` only matters to the mobile sheet, which lists the home page's sections and the site's
// pages separately (and gives PRO its own card); the desktop pill shows them all in one row.
export const LINKS = [
  { href: '#features', label: 'Features', group: 'explore' },
  { href: '#compare', label: 'Compare', group: 'explore' },
  { href: '/docs', label: 'Docs', group: 'resources' },
  { href: '/changelog', label: 'Changelog', group: 'resources' },
  { href: '/blog', label: 'Blog', group: 'resources' },
  { href: '/pro', label: 'PRO', group: 'pro', pro: true },
] as const

// Same destinations and icons as the footer's social links (LandingFooter.tsx)
export const SOCIALS = [
  { href: 'https://github.com/zevnda/steam-game-idler', label: 'GitHub', icon: FaGithub },
  { href: 'https://discord.com/invite/5kY2ZbVnZ8', label: 'Discord', icon: FaDiscord },
]
