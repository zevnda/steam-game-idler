import React from 'react'
import { FaArrowRight } from 'react-icons/fa6'

export default function CardLink({
  icon,
  title,
  href,
  description,
}: {
  icon: React.ElementType
  title: string
  href: string
  description?: string
}) {
  return (
    <div className='docs-card group'>
      <a href={href} className='flex items-center gap-2.5 font-medium text-text-primary'>
        <div className='docs-card__icon'>{React.createElement(icon)}</div>
        <div>{title}</div>
        <FaArrowRight
          size={13}
          className='-ml-1 shrink-0 text-text-muted transition-transform duration-150 group-hover:translate-x-1 group-hover:text-text-primary'
        />
      </a>
      {description && (
        <p className='mt-2.5 text-text-muted text-sm leading-relaxed'>{description}</p>
      )}
    </div>
  )
}
