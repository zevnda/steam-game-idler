import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaStar } from 'react-icons/fa6'
import { Button, Modal, Spinner } from '@heroui/react'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { openExternalLink } from '@/shared/utils/links'

// Mounted once at root (`_app.tsx`), toggled from anywhere via `updateStore.showChangelog` (the
// Menu's "Changelog" item, and future update-flow entry points) - mirrors `main`'s equivalent
// exactly: the changelog content itself lives on steamgameidler.com, not maintained locally, so
// this is just a version-aware iframe wrapper rather than a content-authoring surface.
//
// No visible `Modal.Header` - `main` renders the iframe edge-to-edge against the dialog's own
// rounded corners, with only the footer visually separated (`border-t`). Same no-header/sr-only-
// heading/floating-close-button pattern as GoProModal and SettingsModal.
export const ChangelogModal = () => {
  const { t } = useTranslation()
  const showChangelog = useUpdateStore(state => state.showChangelog)
  const setShowChangelog = useUpdateStore(state => state.setShowChangelog)
  const [appVersion, setAppVersion] = useState<string | null>(null)

  useEffect(() => {
    if (showChangelog && appVersion === null) {
      getVersion()
        .then(setAppVersion)
        .catch(() => setAppVersion('latest'))
    }
  }, [showChangelog, appVersion])

  return (
    <Modal isOpen={showChangelog} onOpenChange={open => setShowChangelog(open)}>
      <Modal.Backdrop>
        <Modal.Container size='lg'>
          <Modal.Dialog className='overflow-hidden p-0 bg-[#1d1d1dff]'>
            <Modal.Header className='p-4'>
              <Modal.Heading>{t('menu.changelog')}</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Heading className='sr-only'>{t('menu.changelog')}</Modal.Heading>
            <Modal.Body className='p-0'>
              {appVersion ? (
                <iframe
                  className='min-h-125 w-full'
                  src={`https://steamgameidler.com/changelog/${appVersion}`}
                  title={t('menu.changelog')}
                />
              ) : (
                <div className='flex min-h-125 items-center justify-center'>
                  <Spinner size='lg' />
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className='justify-between mt-0 p-4 bg-[#000000ff]'>
              <Button
                size='sm'
                className='bg-amber-500 hover:bg-amber-500'
                onPress={() => openExternalLink('https://github.com/zevnda/steam-game-idler')}
              >
                <FaStar fontSize={16} />
                {t('changelog.star')}
              </Button>
              <Button
                size='sm'
                className='bg-white text-black hover:bg-white/90'
                onPress={() =>
                  openExternalLink(`https://steamgameidler.com/changelog#${appVersion ?? ''}`)
                }
              >
                {t('menu.changelog')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  )
}
