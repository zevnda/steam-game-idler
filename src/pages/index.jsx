import React from 'react';
import { AppProvider } from '../components/layouts/components/AppContext';
import Layout from '@/src/components/layouts/components/Layout';
import Window from '@/src/components/layouts/components/Window';

export default function index() {
    return (
        <AppProvider>
            <Layout>
                <Window />
            </Layout>
        </AppProvider>
    );
}