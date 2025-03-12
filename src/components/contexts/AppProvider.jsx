import { StateProvider } from '@/components/contexts/StateContext';
import { SearchProvider } from '@/components/contexts/SearchContext';
import { NavigationProvider } from '@/components/contexts/NavigationContext';
import { UserProvider } from '@/components/contexts/UserContext';
import { UpdateProvider } from '@/components/contexts/UpdateContext';

export default function AppProvider({ children }) {
    return (
        <StateProvider>
            <SearchProvider>
                <NavigationProvider>
                    <UserProvider>
                        <UpdateProvider>
                            {children}
                        </UpdateProvider>
                    </UserProvider>
                </NavigationProvider>
            </SearchProvider>
        </StateProvider>
    );
}