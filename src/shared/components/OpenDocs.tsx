import { IoMdHelpCircleOutline } from 'react-icons/io'
import { openExternalLink } from '@/shared/utils'

interface OpenDocsProps {
  path: string
  content?: string
  className?: string
}

export function OpenDocs({ path, content = '', className = '' }: OpenDocsProps) {
  const href = `https://steamgameidlers.com/docs/${path}`
  return (
    <a
      className={`w-fit h-fit cursor-pointer ${className}`}
      href={href}
      onClick={e => {
        e.preventDefault()
        openExternalLink(href)
      }}
    >
      {content ? (
        <p className='text-xs text-altwhite hover:text-altwhite/90 duration-150 cursor-pointer'>
          {content}
        </p>
      ) : (
        <IoMdHelpCircleOutline
          size={16}
          className='text-altwhite hover:text-altwhite/90 duration-150 cursor-pointer'
        />
      )}
    </a>
  )
}
