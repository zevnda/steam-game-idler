import type { ReactElement } from 'react'

export default function AdSlot(): ReactElement {
  return (
    <div>
      <iframe
        className='overflow-scroll rounded-lg'
        src='https://steamgameidler.com/ad-page'
        width='640'
        height='500'
        title='External Website'
        sandbox='allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation'
      />
    </div>
  )
}
