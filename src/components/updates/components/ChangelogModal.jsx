import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from '@nextui-org/react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import ExtLink from '../../ui/components/ExtLink';
import styles from '../styles/ChangelogModal.module.css';
import { transformIssueReferences, transformLinks, transformMentions } from '../utils/changelogHandler';
import useChangelog from '../hooks/useChangelog';

export default function ChangelogModal({ showChangelogModal, setShowChangelogModal }) {
    const { changelog, version, handleCloseModal } = useChangelog(setShowChangelogModal);

    return (
        <React.Fragment>
            <Modal isOpen={showChangelogModal} backdrop='opaque' className='min-w-[700px] border border-border'>
                <ModalContent>
                    <React.Fragment>
                        <ModalHeader className='flex flex-col gap-1 bg-modalheader border-b border-border' data-tauri-drag-region>
                            Changelog for v{version}
                        </ModalHeader>
                        <ModalBody className='bg-modalbody max-h-[380px] overflow-y-auto'>
                            {changelog ? (
                                <React.Fragment>
                                    <ReactMarkdown
                                        className={`${styles.list} text-sm`}
                                        rehypePlugins={[rehypeRaw]}
                                    >
                                        {transformLinks(transformIssueReferences(transformMentions(changelog)))}
                                    </ReactMarkdown>
                                    <ExtLink href={'https://github.com/zevnda/steam-game-idler/issues/new/choose'}>
                                        <p className='text-sm text-sgi'>
                                            Report any issues on GitHub
                                        </p>
                                    </ExtLink>
                                </React.Fragment>
                            ) : (
                                <div className='flex justify-center items-center min-h-[100px]'>
                                    <Spinner />
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter className='bg-modalfooter border-t border-border'>
                            <div className='flex justify-center items-center gap-4'>
                                <ExtLink href='https://github.com/zevnda/steam-game-idler/releases/latest'>
                                    <p className='text-xs cursor-pointer'>
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
                    </React.Fragment>
                </ModalContent>
            </Modal>
        </React.Fragment>
    );
}