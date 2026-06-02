import { useEffect, useState } from 'react'
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  Spinner,
  useDisclosure,
} from '@heroui/react'
import 'github-markdown-css/github-markdown-light.css'
import { getVersion } from '@tauri-apps/api/app'
import { useTranslation } from 'react-i18next'
import { FaStar } from 'react-icons/fa6'
import { useSessionStore } from '@/shared/stores'
import { openExternalLink } from '@/shared/utils'

export function ChangelogModal() {
  const { t } = useTranslation()
  const showChangelog = useSessionStore(s => s.showChangelog)
  const setShowChangelog = useSessionStore(s => s.setShowChangelog)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [appVersion, setAppVersion] = useState('')
  const [isVersionLoaded, setIsVersionLoaded] = useState(false)

  useEffect(() => {
    getVersion()
      .then(v => {
        setAppVersion(v)
        setIsVersionLoaded(true)
      })
      .catch(() => {
        setAppVersion('latest')
        setIsVersionLoaded(true)
      })
  }, [])

  useEffect(() => {
    if (showChangelog && isVersionLoaded) {
      onOpen()
      setShowChangelog(false)
    }
  }, [onOpen, showChangelog, setShowChangelog, isVersionLoaded])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='lg'
      className='text-content bg-transparent border border-border rounded-4xl'
      classNames={{ closeButton: 'mr-1.5 mt-1.5' }}
      style={{ backgroundImage: 'linear-gradient(to bottom, #1d1d1dff 0%, #000000ff 100%)' }}
    >
      <ModalContent>
        <ModalBody className='p-0'>
          {isVersionLoaded ? (
            <iframe
              src={`https://steamgameidlers.com/changelog/${appVersion}`}
              className='min-h-125'
            />
          ) : (
            <div className='flex items-center justify-center min-h-125'>
              <Spinner variant='simple' className='m-10' />
            </div>
          )}
        </ModalBody>
        <ModalFooter className='border-t border-border justify-between'>
          <Button
            size='sm'
            color='warning'
            variant='flat'
            radius='full'
            className='font-semibold'
            startContent={<FaStar size={20} />}
            onPress={() => openExternalLink('https://github.com/zevnda/steam-game-idler')}
          >
            {t('changelog.star')}
          </Button>
          <div className='flex gap-2'>
            <Button
              size='sm'
              color='danger'
              variant='light'
              radius='full'
              className='font-semibold'
              onPress={onOpenChange}
            >
              {t('common.close')}
            </Button>
            <Button
              size='sm'
              radius='full'
              className='bg-white text-black font-semibold'
              onPress={() =>
                openExternalLink(`https://steamgameidlers.com/changelog#${appVersion}`)
              }
            >
              {t('menu.changelog')}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
