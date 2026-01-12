import type { ReactElement } from 'react'

import { Button, Modal, ModalBody, ModalContent, ModalFooter, Spinner, useDisclosure } from '@heroui/react'
import { useEffect, useState } from 'react'

import 'github-markdown-css/github-markdown-light.css'

import { getVersion } from '@tauri-apps/api/app'

import { useUpdateStore } from '@/stores/updateStore'
import { useTranslation } from 'react-i18next'
import { FaStar } from 'react-icons/fa6'

import { handleOpenExtLink } from '@/utils/tasks'

export default function ChangelogModal(): ReactElement | null {
  const { t } = useTranslation()
  const showChangelog = useUpdateStore(state => state.showChangelog)
  const setShowChangelog = useUpdateStore(state => state.setShowChangelog)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [appVersion, setAppVersion] = useState('')
  const [isVersionLoaded, setIsVersionLoaded] = useState(false)

  useEffect(() => {
    if (showChangelog && isVersionLoaded) {
      onOpen()
      setShowChangelog(false)
    }
  }, [onOpen, showChangelog, setShowChangelog, isVersionLoaded])

  useEffect(() => {
    ;(async () => {
      try {
        const version = await getVersion()
        setAppVersion(version)
        setIsVersionLoaded(true)
      } catch (error) {
        console.error('Failed to get app version:', error)
        setAppVersion('latest')
        setIsVersionLoaded(true)
      }
    })()
  }, [])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='lg'
      className='text-content bg-transparent border border-border rounded-4xl'
      classNames={{
        closeButton: 'mr-1.5 mt-1.5',
      }}
      style={{
        backgroundImage: 'linear-gradient(to bottom, #1d1d1dff 0%, #000000ff 100%)',
      }}
    >
      <ModalContent>
        <ModalBody className='p-0'>
          {isVersionLoaded ? (
            <iframe src={`https://steamgameidler.com/changelog/${appVersion}`} className='min-h-[500px]' />
          ) : (
            <div className='flex items-center justify-center min-h-[500px]'>
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
            onPress={() => handleOpenExtLink('https://github.com/Autapomorph/steam-game-idler')}
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
              onPress={() => handleOpenExtLink(`https://steamgameidler.com/changelog#${appVersion}`)}
            >
              {t('menu.changelog')}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
