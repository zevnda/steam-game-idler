import React from 'react';

import AppProvider from '@/components/contexts/AppProvider';
import Layout from '@/components/layout/Layout';
import Window from '@/components/layout/Window';

export default function Index() {
    return (
        <AppProvider>
            <Layout>
                <Window />
            </Layout>
        </AppProvider>
    );
}