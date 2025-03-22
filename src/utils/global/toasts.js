import { addToast } from '@heroui/react';

import ErrorToast from '@/components/ui/ErrorToast';

export async function showSuccessToast(description) {
    addToast({ description, color: 'success' });
}

export async function showPrimaryToast(description) {
    addToast({ description, color: 'primary' });
}

export async function showWarningToast(description) {
    addToast({ description, color: 'warning' });
}

export async function showDangerToast(description) {
    addToast({ description, color: 'danger' });
}

export async function showSteamNotRunningToast() {
    addToast({
        description: <ErrorToast
            message='Steam is not running'
            href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Steam%20is%20not%20running'
        />,
        color: 'danger'
    });
}

export async function showAccountMismatchToast(color) {
    addToast({
        description: <ErrorToast
            message='Account mismatch between Steam and SGI'
            href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Account%20mismatch%20between%20Steam%20and%20SGI'
        />,
        color
    });
}

export async function showMissingCredentialsToast() {
    addToast({
        description: <ErrorToast
            message='Missing card farming credentials in "settings > card farming"'
            href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Missing%20card%20farming%20credentials%20in%20%E2%80%9Csettings%20%3E%20card%20farming%22'
        />,
        color: 'danger'
    });
}

export async function showOutdatedCredentialsToast() {
    addToast({
        description: <ErrorToast
            message='Card farming credentials need to be updated in "settings > card farming"'
            href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Card%20farming%20credentials%20need%20to%20be%20updated%20in%20%E2%80%9Csettings%20%3E%20card%20farming%22'
        />,
        color: 'danger'
    });
}

export async function showEnableAllGamesToast() {
    addToast({
        description: <ErrorToast
            message='Add some games to your card farming list or enable "all games" in "settings > card farming"'
            href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Add%20some%20games%20to%20your%20card%20farming%20list%20or%20enable%20%E2%80%9Call%20games%E2%80%9D%20in%20%E2%80%9Csettings%20%3E%20card%20farming%22'
        />,
        color: 'danger'
    });
}

export async function showIncorrectCredentialsToast() {
    addToast({
        description: <ErrorToast
            message='Incorrect card farming credentials'
            href='https://steamgameidler.vercel.app/faq#error-messages:~:text=Incorrect%20card%20farming%20credentials'
        />,
        color: 'danger'
    });
}

export async function showNoGamesToast() {
    addToast({
        description: <ErrorToast
            message='There are no games in your achievement unlocker list'
            href='https://steamgameidler.vercel.app/faq#error-messages:~:text=There%20are%20no%20games%20in%20your%20achievement%20unlocker%20list'
        />,
        color: 'danger'
    });
}