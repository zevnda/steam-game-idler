import React from 'react';

import { AppProvider } from '@/components/layout/AppContext';
import Layout from '@/components/layout/Layout';
import Window from '@/components/layout/Window';

export default function index() {
    return (
        <AppProvider>
            <Layout>
                <Window />
            </Layout>
        </AppProvider>
    );
}