import { Spinner } from '@heroui/react'

export const Loader = ({ label, styles }: { label?: string; styles?: string }) => {
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
