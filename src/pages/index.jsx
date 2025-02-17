import React from 'react';

import { AppProvider } from '@/src/components/layout/AppContext';
import { ColorProvider } from '../components/layout/ColorContext';
import Layout from '@/src/components/layout/Layout';
import Window from '@/src/components/layout/Window';

export default function index() {
    return (
        <AppProvider>
            <ColorProvider>
                <Layout>
                    <Window />
                </Layout>
            </ColorProvider>
        </AppProvider>
    );
}