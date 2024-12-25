import React from 'react';
import { AppProvider } from '../components/layout/components/AppContext';
import Layout from '@/src/components/layout/components/Layout';
import Window from '@/src/components/layout/components/Window';

export default function index() {
    return (
        <AppProvider>
            <Layout>
                <Window />
            </Layout>
        </AppProvider>
    );
}