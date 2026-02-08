import { openExternalLink } from '@/shared/utils'

interface ExtLinkProps {
  children: React.ReactNode
  href: string
  className?: string
}

export const ExtLink = ({ children, href, className = '' }: ExtLinkProps) => {
  return (
    <a
      className={`w-fit h-fit cursor-pointer ${className}`}
      href={href}
      onClick={e => {
        e.preventDefault()
        openExternalLink(href)
      }}
    >
      {children}
    </a>
  )
}
