import { IoMdHelpCircleOutline } from 'react-icons/io'
import { openExternalLink } from '@/shared/utils'

interface OpenDocsProps {
  path: string
  content?: string
  className?: string
}

export const OpenDocs = ({ path, content = '', className = '' }: OpenDocsProps) => {
  return (
    <a
      className={`w-fit h-fit cursor-pointer ${className}`}
      href={`https://steamgameidler.com/docs/${path}`}
      onClick={e => {
        e.preventDefault()
        // openExternalLink(`https://steamgameidler.com/docs/${path}`)
        openExternalLink(`http://localhost:3001/docs/${path}`)
      }}
    >
      {!content ? (
        <IoMdHelpCircleOutline
          size={16}
          className='text-altwhite hover:text-altwhite/90 duration-150 cursor-pointer'
        />
      ) : (
        <p className='text-xs text-altwhite hover:text-altwhite/90 duration-150 cursor-pointer'>
          {content}
        </p>
      )}
    </a>
  )
}
