import React from 'react';

import { AppProvider } from '@/src/components/layout/AppContext';
import Layout from '@/src/components/layout/Layout';
import Window from '@/src/components/layout/Window';

export default function index() {
    return (
        <AppProvider>
            <Layout>
                <Window />
            </Layout>
        </AppProvider>
    );
}