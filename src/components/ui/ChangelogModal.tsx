import type { ReactElement } from 'react'

import { Button, Spinner, useDisclosure } from '@heroui/react'
import { useEffect } from 'react'
import styles from '@/styles/ChangelogModal.module.css'
import { useTranslation } from 'react-i18next'
import { TbStarFilled } from 'react-icons/tb'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

import { useUpdateContext } from '@/components/contexts/UpdateContext'
import CustomModal from '@/components/ui/CustomModal'
import ExtLink from '@/components/ui/ExtLink'
import useChangelog, { transformIssueReferences, transformLinks, transformMentions } from '@/hooks/ui/useChangelog'

export default function ChangelogModal(): ReactElement {
  const { t } = useTranslation()
  const { showChangelog, setShowChangelog } = useUpdateContext()
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const { changelog, version } = useChangelog()

  useEffect(() => {
    if (showChangelog) {
      onOpen()
      setShowChangelog(false)
    }
  }, [onOpen, showChangelog, setShowChangelog])

  return (
    <CustomModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      hideCloseButton={true}
      className='min-w-[830px] max-h-[480px]'
      title={
        <div className='flex justify-between items-center w-full'>
          <p>
            {t('changelog.title', {
              version: `v${version}`,
            })}
          </p>
          <ExtLink href='https://github.com/zevnda/steam-game-idler'>
            <div className='flex items-center gap-2 text-yellow-400 hover:text-yellow-500'>
              <TbStarFilled />
              <p className='text-sm'>{t('changelog.star')}</p>
            </div>
          </ExtLink>
        </div>
      }
      body={
        changelog ? (
          <div className={`${styles.list} text-sm`}>
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {transformLinks(transformIssueReferences(transformMentions(changelog)))}
            </ReactMarkdown>
          </div>
        ) : (
          <div className='flex justify-center items-center min-h-[100px]'>
            <Spinner variant='simple' />
          </div>
        )
      }
      buttons={
        <div className='flex justify-center items-center gap-4'>
          <ExtLink href='https://github.com/zevnda/steam-game-idler/issues/new/choose'>
            <p className='text-xs cursor-pointer hover:text-altwhite duration-150 p-2 rounded-lg'>
              {t('changelog.report')}
            </p>
          </ExtLink>
          <ExtLink href='https://github.com/zevnda/steam-game-idler/releases/latest'>
            <p className='text-xs cursor-pointer hover:text-altwhite duration-150 p-2 rounded-lg'>
              {t('changelog.release')}
            </p>
          </ExtLink>
          <Button size='sm' className='font-semibold rounded-lg bg-dynamic text-button-text' onPress={onOpenChange}>
            {t('common.continue')}
          </Button>
        </div>
      }
    />
  )
}
