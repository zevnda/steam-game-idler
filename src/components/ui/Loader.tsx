import type { ReactElement } from 'react'

import { Spinner } from '@heroui/react'

export default function Loader({ label, styles }: { label?: string; styles?: string }): ReactElement {
  return (
    <div className={`flex justify-center items-center w-calc h-calc ${styles}`}>
      <Spinner
        variant='simple'
        label={label}
        classNames={{
          label: 'text-xs',
        }}
      />
    </div>
  )
}
