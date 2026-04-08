import { hasTauriInvoke, openExternalLink } from '@/shared/utils'

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
      target='_blank'
      rel='noopener noreferrer'
      onClick={e => {
        if (hasTauriInvoke()) {
          e.preventDefault()
          void openExternalLink(href)
        }
      }}
    >
      {children}
    </a>
  )
}
