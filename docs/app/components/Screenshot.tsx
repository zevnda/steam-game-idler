import type { JSX, ReactElement } from 'react'

import { cloneElement } from 'react'

export function Screenshot({ children }: { children: JSX.Element }): ReactElement {
  return cloneElement(children, {
    className: 'mt-6 rounded-lg drop-shadow-md border border-[#242424]',
  })
}
