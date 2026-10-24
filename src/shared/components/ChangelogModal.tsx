import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaStar } from 'react-icons/fa6'
import { Button, Modal, Spinner } from '@heroui/react'
import { ModalDragRegion } from '@/shared/components/ModalDragRegion'
import { useUpdateStore } from '@/shared/stores/updateStore'
import { openExternalLink } from '@/shared/utils/links'

// Mounted once at root (`_app.tsx`), toggled from anywhere via `updateStore.showChangelog` (the
// Menu's "Changelog" item, and future update-flow entry points) - mirrors `main`'s equivalent
// exactly: the changelog content itself lives on steamgameidler.com, not maintained locally, so
// this is just a version-aware iframe wrapper rather than a content-authoring surface.
//
// The embedded page paints no background of its own, so the dialog's themed `--overlay` shows
// through it and the changelog matches whichever theme preset is active. Its text colors are
// dark-scheme by default; `?scheme=light` flips them for the light presets (the only ones that set
// `data-theme='light'` on <html> - see `presets.ts`'s `LIGHT_THEME_PRESETS`).
export const ChangelogModal = () => {
  const { t } = useTranslation()
  const showChangelog = useUpdateStore(state => state.showChangelog)
  const setShowChangelog = useUpdateStore(state => state.setShowChangelog)
  const [appVersion, setAppVersion] = useState<string | null>(null)
  // Read at render, not cached: the modal only mounts its iframe while open, so this always
  // reflects the theme in effect when the user opens it.
  const isLightScheme =
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light'

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
        <ModalDragRegion placement='backdrop' />
        <Modal.Container size='lg'>
          <Modal.Dialog className='overflow-hidden p-0'>
            <Modal.Header className='p-4'>
              <Modal.Heading>{t('menu.changelog')}</Modal.Heading>
              <Modal.CloseTrigger />
            </Modal.Header>
            <Modal.Heading className='sr-only'>{t('menu.changelog')}</Modal.Heading>
            {/* The embedded page (`docs/app/(embed)/changelog/[slug]`) is an `h-screen` column
                with a fixed title/tags header over its own scrolling notes list, so the body must
                never scroll itself.
                `block` matters too: an inline iframe sits on the text baseline, and the descender
                gap under it overflowed the body by a few px, giving a second scrollbar. */}
            <Modal.Body className='overflow-hidden p-0'>
              {appVersion ? (
                <iframe
                  className='block min-h-125 w-full'
                  src={`https://steamgameidler.com/changelog/${appVersion}${isLightScheme ? '?scheme=light' : ''}`}
                  title={t('menu.changelog')}
                />
              ) : (
                <div className='flex min-h-125 items-center justify-center'>
                  <Spinner size='lg' />
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className='justify-between mt-0 p-4 border-t border-separator'>
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
