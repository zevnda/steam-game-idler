import { open } from '@tauri-apps/plugin-shell'

interface ExtLinkProps {
  children: React.ReactNode
  href: string
  className?: string
}

export const ExtLink = ({ children, href, className = '' }: ExtLinkProps) => {
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    try {
      await open(href)
    } catch (error) {
      console.error('Failed to open link:', error)
    }
  }

  return (
    <a className={`w-fit h-fit cursor-pointer ${className}`} href={href} onClick={handleClick}>
      {children}
    </a>
  )
}
