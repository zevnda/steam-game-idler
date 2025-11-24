import type { ReactElement } from 'react'

import { Button, Modal, ModalBody, ModalContent, ModalFooter, useDisclosure } from '@heroui/react'
import { useEffect, useState } from 'react'

import 'github-markdown-css/github-markdown-light.css'

import { getVersion } from '@tauri-apps/api/app'

import { useTranslation } from 'react-i18next'
import { FaStar } from 'react-icons/fa6'

import { useUpdateContext } from '@/components/contexts/UpdateContext'
import { handleOpenExtLink } from '@/utils/tasks'

export default function ChangelogModal(): ReactElement | null {
  const { t } = useTranslation()
  const { showChangelog, setShowChangelog } = useUpdateContext()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    if (showChangelog) {
      onOpen()
      setShowChangelog(false)
    }
  }, [onOpen, showChangelog, setShowChangelog])

  useEffect(() => {
    ;(async () => {
      const version = await getVersion()
      setAppVersion(version)
    })()
  }, [])

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      size='lg'
      className='text-content bg-transparent border-1 border-border rounded-4xl'
      classNames={{
        closeButton: 'mr-1.5 mt-1.5',
      }}
      style={{
        backgroundImage: 'linear-gradient(to bottom, #1d1d1dff 0%, #000000ff 100%)',
      }}
    >
      <ModalContent>
        <ModalBody className='p-0'>
          <iframe src={`https://steamgameidler.com/changelog/${appVersion}`} className='min-h-[500px]' />
        </ModalBody>

        <ModalFooter className='border-t border-border justify-between'>
          <Button
            size='sm'
            color='warning'
            variant='flat'
            radius='full'
            className='font-semibold'
            startContent={<FaStar size={20} />}
            onPress={onOpenChange}
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
