import { Button, cn, Input } from '@heroui/react';
import Image from 'next/image';
import type { ReactElement } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { TbEraser, TbHelpCircle, TbUpload } from 'react-icons/tb';

import { useUserContext } from '@/components/contexts/UserContext';
import SettingsCheckbox from '@/components/settings/SettingsCheckbox';
import CustomTooltip from '@/components/ui/CustomTooltip';
import ExtLink from '@/components/ui/ExtLink';
import LanguageSwitch from '@/components/ui/i18n/LanguageSwitch';
import ThemeSwitch from '@/components/ui/theme/ThemeSwitch';
import { useGeneralSettings, handleKeySave, handleClear } from '@/hooks/settings/useGeneralSettings';

export default function GeneralSettings(): ReactElement {
    const { t } = useTranslation();
    const { userSummary, setUserSettings } = useUserContext();
    const { keyValue, setKeyValue, hasKey, setHasKey } = useGeneralSettings();

    return (
        <div className='relative flex flex-col gap-4'>
            <div className='border border-border rounded-lg bg-titlebar w-fit'>
                <div className='flex items-center gap-2 p-2'>
                    <Image
                        src={userSummary?.avatar || ''}
                        height={40}
                        width={40}
                        alt='user avatar'
                        className='w-[40px] h-[40px] rounded-full'
                        priority
                    />
                    <div className='max-w-[500px] overflow-hidden'>
                        <p className='font-bold truncate'>
                            {userSummary?.personaName}
                        </p>
                        <p className='text-sm text-altwhite truncate'>
                            {userSummary?.steamId}
                        </p>
                    </div>
                </div>
            </div>

            <div className='flex flex-col gap-4 border border-border rounded-lg p-3 bg-titlebar'>
                <p className='font-bold'>
                    {t('common.options')}
                </p>

                <SettingsCheckbox
                    type='general'
                    name='antiAway'
                    content={t('settings.general.antiAway')}
                />

                <SettingsCheckbox
                    type='general'
                    name='freeGameNotifications'
                    content={t('settings.general.freeGameNotifications')}
                />

                <div className='flex items-center'>
                    <SettingsCheckbox
                        type='general'
                        name='useBeta'
                        content={t('settings.general.useBeta')}
                    />
                    <CustomTooltip
                        content={t('settings.general.useBetaTooltip')}
                        placement='right'
                        className='w-[330px] text-sm'
                    >
                        <TbHelpCircle className='text-altwhite ml-1.5' size={18} />
                    </CustomTooltip>
                </div>

                <SettingsCheckbox
                    type='general'
                    name='runAtStartup'
                    content={t('settings.general.runAtStartup')}
                />
            </div>

            <div className='flex gap-4'>
                <div className='flex gap-6 border border-border rounded-lg p-3 bg-titlebar w-full'>
                    <div className='flex flex-col gap-2 w-full'>
                        <p className='font-bold'>
                            {t('settings.general.language')}
                        </p>

                        <LanguageSwitch />

                        <span className='text-xs'>
                            <ExtLink href='https://github.com/zevnda/steam-game-idler/discussions/148' className='text-link hover:text-linkhover'>
                                {t('settings.general.helpTranslate')}
                            </ExtLink>
                        </span>
                    </div>
                </div>

                <div className='flex gap-6 border border-border rounded-lg p-3 bg-titlebar w-full'>
                    <div className='flex flex-col gap-2 w-full'>
                        <p className='font-bold'>
                            {t('settings.general.theme')}
                        </p>
                        <ThemeSwitch />
                    </div>
                </div>
            </div>

            <div className='flex flex-col border border-border rounded-lg p-3 bg-titlebar'>
                <div className='flex flex-col'>
                    <p className='font-bold'>
                        {t('settings.general.webApi.placeholder')}
                    </p>
                    <span className='text-xs text-altwhite'>
                        <Trans i18nKey="settings.general.webApi">
                            Use your own
                            <ExtLink
                                href='https://steamcommunity.com/dev/apikey'
                                className='mx-1 text-link hover:text-linkhover'
                            >
                                Steam web API key
                            </ExtLink>
                            <span className='italic'>(optional)</span>
                            <ExtLink
                                href='https://steamgameidler.vercel.app/settings/general#use-your-own-steam-web-api-key'
                                className='mx-1 text-link hover:text-linkhover'
                            >
                                Learn more
                            </ExtLink>
                        </Trans>
                    </span>
                    <div className='flex flex-col gap-2 mt-4'>
                        <Input
                            size='sm'
                            placeholder={t('settings.general.webApi.placeholder')}
                            className='max-w-[280px]'
                            classNames={{
                                inputWrapper: cn(
                                    'bg-input border border-border hover:!bg-inputhover',
                                    'rounded-lg group-data-[focus-within=true]:!bg-inputhover'
                                ),
                                input: ['!text-content placeholder:text-altwhite/50']
                            }}
                            value={keyValue}
                            onChange={(e) => setKeyValue(e.target.value)}
                            type='password'
                        />
                    </div>
                    <div className='flex gap-2 mt-4'>
                        <Button
                            size='sm'
                            isDisabled={hasKey || !keyValue}
                            className='font-semibold rounded-lg bg-dynamic text-button-text'
                            onPress={() => handleKeySave(userSummary?.steamId, keyValue, setHasKey, setUserSettings)}
                            startContent={<TbUpload size={20} />}
                        >
                            {t('common.save')}
                        </Button>
                        <Button
                            size='sm'
                            color='danger'
                            isDisabled={!hasKey}
                            className='font-semibold text-offwhite rounded-lg'
                            onPress={() => handleClear(userSummary?.steamId, setKeyValue, setHasKey, setUserSettings)}
                            startContent={<TbEraser size={20} />}
                        >
                            {t('common.clear')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}