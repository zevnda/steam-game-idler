import { NavigationProvider } from '@/components/contexts/NavigationContext';
import { SearchProvider } from '@/components/contexts/SearchContext';
import { StateProvider } from '@/components/contexts/StateContext';
import { UpdateProvider } from '@/components/contexts/UpdateContext';
import { UserProvider } from '@/components/contexts/UserContext';

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