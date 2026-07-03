interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
}

export default function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  return (
    <div className={`spotlight-card ${className}`}>
      <div className='spotlight-card__content'>{children}</div>
    </div>
  )
}
