'use client'

import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button'
import { Check, Share } from 'lucide-react'

export function ShareButton({ url }: { url: string }) {
  const [isChecked, onCopy] = useCopyButton(() => {
    void navigator.clipboard.writeText(`${window.location.origin}${url}`)
  })

  return (
    <button type='button' onClick={onCopy}>
      {isChecked ? <Check className='size-4' /> : <Share className='size-4' />}
      {isChecked ? 'Copied URL' : 'Share Post'}
    </button>
  )
}
