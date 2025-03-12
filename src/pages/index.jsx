import React from 'react';

import { AppProvider } from '@/components/contexts/AppContext';
import { SearchProvider } from '@/components/contexts/SearchContext';
import { NavigationProvider } from '@/components/contexts/NavigationContext';
import { UserProvider } from '@/components/contexts/UserContext';
import { UpdateProvider } from '@/components/contexts/UpdateContext';
import Layout from '@/components/layout/Layout';
import Window from '@/components/layout/Window';

export default function index() {
    return (
        <AppProvider>
            <SearchProvider>
                <NavigationProvider>
                    <UserProvider>
                        <UpdateProvider>
                            <Layout>
                                <Window />
                            </Layout>
                        </UpdateProvider>
                    </UserProvider>
                </NavigationProvider>
            </SearchProvider>
        </AppProvider>
    );
}