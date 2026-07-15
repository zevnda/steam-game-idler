import { TbArrowLeft } from 'react-icons/tb'
import { Button } from '@heroui/react'

interface BackButtonProps {
  onPress: () => void
}

// Fixed top-left, mirroring UpdateButton's fixed top-right placement (see its doc comment) - both
// sit just below the global Titlebar (h-10) so they don't get covered by its drag region.
const BackButton = ({ onPress }: BackButtonProps) => {
  return (
    <div className='fixed left-4 top-18'>
      <Button isIconOnly aria-label='Back' onPress={onPress}>
        <TbArrowLeft fontSize={18} />
      </Button>
    </div>
  )
}

export default BackButton
