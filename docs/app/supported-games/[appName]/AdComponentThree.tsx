import type { ReactElement } from 'react'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export default function AdComponentThree(): ReactElement {
  const [key, setKey] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setKey(k => k + 1)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Script
      key={key}
      src='//pl28051196.effectivegatecpm.com/c4/26/a5/c426a5dd2fa7302020e196b721701d7e.js'
      strategy='afterInteractive'
    />
  )
}
