import { Select, SelectItem } from '@heroui/react';
import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { TbLanguage } from 'react-icons/tb';

export default function LanguageSwitch(): ReactElement | null {
    const { i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    const languages = [
        // { key: 'ar-SA', label: 'العربية' },
        // { key: 'zh-CN', label: '简体中文' },
        // { key: 'zh-TW', label: '繁體中文' },
        // { key: 'ja-JP', label: '日本語' },
        // { key: 'ko-KR', label: '한국어' },
        { key: 'cs-CZ', label: 'Čeština' },
        // { key: 'da-DK', label: 'Dansk' },
        { key: 'de-DE', label: 'Deutsch' },
        // { key: 'el-GR', label: 'Ελληνικά' },
        { key: 'en-US', label: 'English' },
        // { key: 'es-ES', label: 'Español' },
        // { key: 'fi-FI', label: 'Suomi' },
        { key: 'fr-FR', label: 'Français' },
        // { key: 'hu-HU', label: 'Magyar' },
        { key: 'it-IT', label: 'Italiano' },
        // { key: 'nl-NL', label: 'Nederlands' },
        // { key: 'no-NO', label: 'Norsk' },
        // { key: 'pl-PL', label: 'Polski' },
        { key: 'pt-BR', label: 'Português (Brazil)' },
        // { key: 'pt-PT', label: 'Português (Portugal)' },
        { key: 'ro-RO', label: 'Română' },
        { key: 'ru-RU', label: 'Русский' },
        // { key: 'sv-SE', label: 'Svenska' },
        { key: 'tr-TR', label: 'Türkçe' },
        { key: 'uk-UA', label: 'Українська' },
        // { key: 'vi-VN', label: 'Tiếng Việt' },
    ];

    useEffect(() => {
        setMounted(true);
    }, [i18n]);

    if (!mounted) return null;

    const currentLanguage = languages.find(lang => lang.key === i18n.language)
        ? i18n.language
        : 'en-US';

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
                trigger: ['bg-input border border-border data-[hover=true]:!bg-inputhover data-[open=true]:!bg-inputhover duration-100 rounded-lg'],
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