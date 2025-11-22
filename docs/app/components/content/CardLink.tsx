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
    <div className='bg-fd-card border border-fd-border hover:bg-fd-accent/80 p-4 rounded-lg w-full duration-150 group'>
      <a href={href} className='flex items-center gap-2 no-underline'>
        <div className='p-2 bg-fd-muted text-fd-muted-foreground border border-fd-border rounded-md'>
          {React.createElement(icon)}
        </div>
        <div className='no-underline!'>{title}</div>
        <div>
          <FaArrowRight size={14} className='group-hover:translate-x-1 duration-150' />
        </div>
      </a>
      {description && <p className='mb-0! mt-2 text-fd-muted-foreground text-sm'>{description}</p>}
    </div>
  )
}
