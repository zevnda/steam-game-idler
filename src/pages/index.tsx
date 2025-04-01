import type { ReactElement } from 'react';

import AppProvider from '@/components/contexts/AppProvider';
import ErrorBoundary from '@/components/layout/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import Window from '@/components/layout/Window';
import I18nProvider from '@/components/ui/i18n/I18nProvider';

export default function Index(): ReactElement {
    return (
        <ErrorBoundary>
            <AppProvider>
                <I18nProvider>
                    <Layout>
                        <Window />
                    </Layout>
                </I18nProvider>
            </AppProvider>
        </ErrorBoundary>
    );
}