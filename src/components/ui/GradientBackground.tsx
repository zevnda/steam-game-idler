import type { ReactElement } from 'react'

export default function GradientBackground(): ReactElement {
  return (
    <>
      <div className='absolute -bottom-42 -right-22 w-[700px] h-[600px] rounded-full blur-3xl opacity-7 bg-gradient-to-br from-blue-300 via-cyan-300 to-indigo-400 z-0 pointer-events-none' />

      <div className='absolute -bottom-52 -left-22 w-[900px] h-[700px] rounded-full blur-3xl opacity-7 bg-gradient-to-br from-pink-300 via-purple-300 to-violet-400 z-0 pointer-events-none' />

      <div className='absolute -top-52 left-40 w-[1000px] h-[600px] rounded-full blur-3xl opacity-7 bg-gradient-to-tr from-red-400 via-rose-400 to-orange-400 z-0 pointer-events-none' />
    </>
  )
}
