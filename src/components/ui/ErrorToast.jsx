import { useTranslation } from 'react-i18next';

import ExtLink from '@/components/ui/ExtLink';

export default function ErrorToast({ message, href }) {
    const { t } = useTranslation();

    return (
        <div className='flex flex-col gap-1'>
            <p>
                {message}
            </p>
            <ExtLink href={href}>
                <p className='text-link hover:text-linkhover'>
                    {t('common.learnMore')}
                </p>
            </ExtLink>
        </div>
    );
}