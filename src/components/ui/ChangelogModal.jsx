import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Spinner, useDisclosure } from '@heroui/react';
import { useContext, useEffect } from 'react';
import { TbStarFilled } from 'react-icons/tb';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

import { UpdateContext } from '@/components/contexts/UpdateContext';
import ExtLink from '@/components/ui/ExtLink';
import useChangelog, { transformIssueReferences, transformLinks, transformMentions } from '@/hooks/ui/useChangelog';
import styles from '@/styles/ChangelogModal.module.css';

export default function ChangelogModal() {
    const { showChangelog, setShowChangelog } = useContext(UpdateContext);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const { changelog, version } = useChangelog();

    useEffect(() => {
        if (showChangelog) {
            onOpen();
            setShowChangelog(false);
        }
    }, [onOpen, showChangelog, setShowChangelog]);

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} hideCloseButton className='min-w-[830px] max-h-[480px] bg-modalbody text-content' classNames={{ closeButton: ['text-altwhite hover:bg-titlehover duration-200'] }}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className='flex justify-between items-center w-full bg-modalheader border-b border-border' data-tauri-drag-region>
                            <p>Changes in v{version}</p>
                            <ExtLink href='https://github.com/zevnda/steam-game-idler'>
                                <div className='flex items-center gap-2 text-yellow-400 hover:text-yellow-500'>
                                    <TbStarFilled />
                                    <p className='text-sm'>
                                        Star on GitHub
                                    </p>
                                </div>
                            </ExtLink>
                        </ModalHeader>
                        <ModalBody className='max-h-[380px] overflow-y-auto bg-modalbody'>
                            {changelog ? (
                                <div className={`${styles.list} text-sm`}>
                                    <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                        {transformLinks(transformIssueReferences(transformMentions(changelog)))}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <div className='flex justify-center items-center min-h-[100px]'>
                                    <Spinner variant='simple' />
                                </div>
                            )}
                        </ModalBody>
                        <ModalFooter className='bg-modalfooter border-t border-border'>
                            <div className='flex justify-center items-center gap-4'>
                                <ExtLink href='https://github.com/zevnda/steam-game-idler/issues/new/choose'>
                                    <p className='text-xs cursor-pointer hover:text-altwhite duration-150 p-2 rounded-lg'>
                                        Report issue on GitHub
                                    </p>
                                </ExtLink>
                                <ExtLink href='https://github.com/zevnda/steam-game-idler/releases/latest'>
                                    <p className='text-xs cursor-pointer hover:text-altwhite duration-150 p-2 rounded-lg'>
                                        View on GitHub
                                    </p>
                                </ExtLink>
                                <Button
                                    size='sm'
                                    className='font-semibold rounded-lg bg-dynamic text-button'
                                    onPress={onClose}
                                >
                                    Continue
                                </Button>
                            </div>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}