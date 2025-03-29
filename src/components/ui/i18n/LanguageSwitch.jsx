import { Select, SelectItem } from '@heroui/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbLanguage } from 'react-icons/tb';

export default function LanguageSwitch() {
    const { t, i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    const languages = [
        { key: 'en', label: t('settings.general.languages.english') },
        { key: 'de', label: t('settings.general.languages.german') },
        { key: 'fr', label: t('settings.general.languages.french') },
        { key: 'it', label: t('settings.general.languages.italian') },
        { key: 'pt-BR', label: t('settings.general.languages.portuguese_brazil') },
        { key: 'ru', label: t('settings.general.languages.russian') },
        { key: 'tr', label: t('settings.general.languages.turkish') },
        { key: 'uk', label: t('settings.general.languages.ukrainian') },
    ];

    useEffect(() => {
        setMounted(true);
    }, [i18n]);

    if (!mounted) return null;

    const currentLanguage = languages.find(lang => lang.key === i18n.language)
        ? i18n.language
        : 'en';

    return (
        <Select
            size='sm'
            aria-label='language'
            disallowEmptySelection
            radius='none'
            startContent={<TbLanguage />}
            items={languages}
            className='w-[205px]'
            classNames={{
                listbox: ['p-0'],
                value: ['text-sm !text-content'],
                trigger: ['bg-titlebar border border-border data-[hover=true]:!bg-input data-[open=true]:!bg-input duration-100 rounded-lg'],
                popoverContent: ['bg-titlebar border border-border rounded-lg justify-start !text-content'],
            }}
            defaultSelectedKeys={[currentLanguage]}
            onSelectionChange={(e) => {
                const selectedLanguage = e.currentKey;
                i18n.changeLanguage(selectedLanguage);
            }}
        >
            {(language) => <SelectItem classNames={{ base: ['data-[hover=true]:!bg-titlehover data-[hover=true]:!text-content'] }}>{language.label}</SelectItem>}
        </Select>
    );
}