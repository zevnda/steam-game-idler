import { Fragment } from 'react';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from '@heroui/react';

import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

import { transformIssueReferences, transformLinks, transformMentions } from '@/src/utils/updates/changelogHandler';
import useChangelog from '@/src/hooks/updates/useChangelog';
import styles from '@/src/styles/ChangelogModal.module.css';
import ExtLink from '@/src/components/ui/ExtLink';

export default function ChangelogModal({ showChangelogModal, setShowChangelogModal }) {
    const { changelog, version, handleCloseModal } = useChangelog(setShowChangelogModal);

    return (
        <Fragment>
            <Modal isOpen={showChangelogModal} className='min-w-[830px] max-h-[490px] border border-border'>
                <ModalContent>
                    <Fragment>
                        <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                            Changelog for v{version}
                        </ModalHeader>
                        <ModalBody className='max-h-[380px] overflow-y-auto'>
                            {changelog ? (
                                <Fragment>
                                    <ReactMarkdown
                                        className={`${styles.list} text-sm`}
                                        rehypePlugins={[rehypeRaw]}
                                    >
                                        {transformLinks(transformIssueReferences(transformMentions(changelog)))}
                                    </ReactMarkdown>
                                </Fragment>
                            ) : (
                                <div className='flex justify-center items-center min-h-[100px]'>
                                    <Spinner />
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter className='bg-modalfooter border-t border-border'>
                            <div className='flex justify-center items-center gap-4'>
                                <ExtLink href={'https://github.com/zevnda/steam-game-idler/issues/new/choose'}>
                                    <p className='text-xs cursor-pointer hover:text-altwhite duration-150 p-2 rounded'>
                                        Report issue on GitHub
                                    </p>
                                </ExtLink>
                                <ExtLink href='https://github.com/zevnda/steam-game-idler/releases/latest'>
                                    <p className='text-xs cursor-pointer hover:text-altwhite duration-150 p-2 rounded'>
                                        View on GitHub
                                    </p>
                                </ExtLink>
                                <Button
                                    size='sm'
                                    color='primary'
                                    className='font-semibold rounded'
                                    onPress={handleCloseModal}
                                >
                                    Continue
                                </Button>
                            </div>
                        </ModalFooter>
                    </Fragment>
                </ModalContent>
            </Modal>
        </Fragment>
    );
}