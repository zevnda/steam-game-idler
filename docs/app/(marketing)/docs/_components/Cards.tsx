// `not-prose`: the cards style their own text, so the docs' prose link/paragraph rules stay out
export default function Cards({ children }: { children: React.ReactNode }) {
  return (
    <div className='not-prose my-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
      {children}
    </div>
  )
}
