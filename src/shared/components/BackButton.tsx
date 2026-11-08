import { TbArrowLeft } from 'react-icons/tb'
import { Button } from '@heroui/react'

interface BackButtonProps {
  onPress: () => void
  // For hosts that place it themselves (AddAccountModal), rather than AuthLayout's reserved row
  inline?: boolean
}

// Fixed over the row AuthLayout reserves at the top of its panel by default, so the screens using
// this can render it from anywhere. `left-12` is the panel's padding, which lines the button up
// with the content below it.
const BackButton = ({ onPress, inline = false }: BackButtonProps) => {
  const button = (
    <Button isIconOnly variant='secondary' onPress={onPress}>
      <TbArrowLeft fontSize={18} />
    </Button>
  )

  return inline ? button : <div className='fixed left-12 top-22 z-10'>{button}</div>
}

export default BackButton
