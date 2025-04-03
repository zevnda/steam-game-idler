import { Button, Input, Tooltip } from '@heroui/react';
import Image from 'next/image';
import type { ReactElement } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { TbHelpCircle } from 'react-icons/tb';

import { useUserContext } from '@/components/contexts/UserContext';
import SettingsCheckbox from '@/components/settings/SettingsCheckbox';
import ExtLink from '@/components/ui/ExtLink';
import LanguageSwitch from '@/components/ui/i18n/LanguageSwitch';
import ThemeSwitch from '@/components/ui/theme/ThemeSwitch';
import { useGeneralSettings, handleKeySave, handleClear } from '@/hooks/settings/useGeneralSettings';

export default function GeneralSettings(): ReactElement {
    const { t } = useTranslation();
    const { userSummary, setUserSettings } = useUserContext();
    const { keyValue, setKeyValue, hasKey, setHasKey } = useGeneralSettings();

    return (
        <div className='relative flex flex-col gap-4 p-2 overflow-y-auto max-h-[410px]'>
            <div className='absolute top-0 right-2'>
                <p className='text-xs text-altwhite mb-0.5'>
                    {t('settings.general.userSummary')}
                </p>
                <div className='border border-border rounded-lg bg-input hover:bg-titlebar dark:bg-[#131313] dark:hover:bg-[#171717]'>
                    <ExtLink href={`https://steamcommunity.com/profiles/${userSummary?.steamId}`}>
                        <div className='flex items-center gap-2 h-full p-2 group'>
                            <Image
                                src={userSummary?.avatar || ''}
                                height={40}
                                width={40}
                                alt='user avatar'
                                className='w-[40px] h-[40px] rounded-full group-hover:scale-110 duration-200'
                                priority
                            />
                            <div className='w-[140px]'>
                                <p className='font-medium truncate'>
                                    {userSummary?.personaName}
                                </p>
                                <p className='text-xs text-altwhite truncate'>
                                    {userSummary?.steamId}
                                </p>
                            </div>
                        </div>
                    </ExtLink>
                </div>
            </div>

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

            <div className='flex items-center gap-2'>
                <SettingsCheckbox
                    type='general'
                    name='useBeta'
                    content={t('settings.general.useBeta')}
                />
                <Tooltip
                    size='sm'
                    content='Beta features may be unstable or change unexpectedly. If you experience any issues when using a beta feature, please report it on GitHub'
                    placement='right'
                    closeDelay={0}
                    className='w-[320px]'
                >
                    <TbHelpCircle className='text-altwhite' strokeWidth={1} />
                </Tooltip>
            </div>

            <SettingsCheckbox
                type='general'
                name='runAtStartup'
                content={t('settings.general.runAtStartup')}
            />

            <div className='flex gap-6'>
                <div className='flex flex-col gap-2'>
                    <p className='text-xs mt-2'>
                        {t('settings.general.language')}
                    </p>
                    <LanguageSwitch />
                    <span className='text-xs ml-1'>
                        <ExtLink href='https://github.com/zevnda/steam-game-idler/discussions/148' className='text-link hover:text-linkhover'>
                            {t('settings.general.helpTranslate')}
                        </ExtLink>
                    </span>
                </div>

                <div className='flex flex-col gap-2'>
                    <p className='text-xs mt-2'>
                        {t('settings.general.theme')}
                    </p>
                    <ThemeSwitch />
                </div>
            </div>

            <div className='flex flex-col'>
                <p className='text-xs my-2' >
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
                </p>
                <div className='flex gap-2'>
                    <Input
                        size='sm'
                        placeholder={t('settings.general.webApi.placeholder')}
                        className='max-w-[280px]'
                        classNames={{
                            inputWrapper: ['bg-input border border-border hover:!bg-titlebar rounded-lg group-data-[focus-within=true]:!bg-titlebar'],
                            input: ['!text-content placeholder:text-altwhite/50']
                        }}
                        value={keyValue}
                        onChange={(e) => setKeyValue(e.target.value)}
                        type='password'
                    />
                    <Button
                        size='sm'
                        isDisabled={hasKey || !keyValue}
                        className='font-semibold rounded-lg bg-dynamic text-button'
                        onPress={() => handleKeySave(userSummary?.steamId, keyValue, setHasKey, setUserSettings)}
                    >
                        {t('common.save')}
                    </Button>
                    <Button
                        size='sm'
                        color='danger'
                        isDisabled={!hasKey}
                        className='font-semibold text-offwhite rounded-lg'
                        onPress={() => handleClear(userSummary?.steamId, setKeyValue, setHasKey, setUserSettings)}
                    >
                        {t('common.clear')}
                    </Button>
                </div>
            </div>
        </div>
    );
}