import { useUserStore } from '@/shared/stores'
import { Logo, PrimaryButton, SecondaryButton } from '@/shared/ui'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { TbArrowRight } from 'react-icons/tb'
import { openExternalLink } from '@/shared/utils'
import { cn } from '@heroui/react'
import { handleSignIn } from './utils/handleSignIn'

interface UserSelectionProps {
  onRefresh: () => void
}

export const UserSelection = ({ onRefresh }: UserSelectionProps) => {
  const { t } = useTranslation()
  const { steamUsers, selectedUser, setSelectedUser } = useUserStore()

  return (
    <div className='flex flex-col items-center'>
      {/* Title */}
      <Logo width={110} height={110} />

      {/* Available Steam accounts */}
      {steamUsers.length > 0 ? (
        <div className='flex flex-col items-center'>
          <p className='text-3xl font-semibold'>{t('sign_in.choose_account')}</p>

          <div className='grid space-x-2 my-10 grid-cols-1 sm:grid-cols-2'>
            {steamUsers.map(user => (
              <div
                key={user.steamId}
                className='flex flex-col items-center cursor-pointer hover:scale-105 duration-150 group'
                onClick={() => setSelectedUser(user)}
                role='button'
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedUser(user)
                  }
                }}
              >
                {/* Avatar */}
                <Image
                  src={user.avatar}
                  alt={user.personaName}
                  width={128}
                  height={128}
                  className={cn(
                    'rounded-lg p-1',
                    selectedUser?.steamId === user?.steamId
                      ? 'ring-transparent bg-linear-to-tr from-cyan-500 via-blue-500 to-violet-700'
                      : 'ring-transparent bg-transparent',
                  )}
                />

                {/* Persona name */}
                <p className='mt-2 text-lg'>{user.personaName}</p>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className='flex space-x-4'>
            <SecondaryButton onPress={onRefresh}>{t('common.refresh')}</SecondaryButton>

            <PrimaryButton
              className='group'
              isDisabled={!selectedUser}
              onPress={() => handleSignIn(steamUsers.indexOf(selectedUser!))}
            >
              {t('common.continue')}
              <TbArrowRight className='group-hover:translate-x-1 duration-150' />
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className='flex flex-col items-center'>
          {/* No accounts found */}
          <p className='text-3xl font-semibold'>{t('sign_in.no_accounts_found')}</p>

          <div className='text-center my-10'>
            <p className='text-altwhite max-w-md'>{t('sign_in.account_instructions')}</p>
          </div>

          <div className='flex space-x-4'>
            <SecondaryButton
              onPress={() =>
                openExternalLink(
                  'https://steamgameidler.com/docs/faq#error-messages:~:text=No%20Steam%20users%20found',
                )
              }
            >
              {t('common.learn_more')}
            </SecondaryButton>

            <PrimaryButton onPress={onRefresh}>{t('common.refresh')}</PrimaryButton>
          </div>
        </div>
      )}
    </div>
  )
}
