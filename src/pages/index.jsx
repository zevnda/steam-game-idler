import React from 'react';

import AppProvider from '@/components/contexts/AppProvider';
import Layout from '@/components/layout/Layout';
import Window from '@/components/layout/Window';
import I18nProvider from '@/components/ui/i18n/I18nProvider';

export default function Index() {
    return (
        <AppProvider>
            <I18nProvider>
                <Layout>
                    <Window />
                </Layout>
            </I18nProvider>
        </AppProvider>
    );
}