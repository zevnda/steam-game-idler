import { useContext, useState } from 'react';

import { SearchContext } from '@/components/contexts/SearchContext';
import { StateContext } from '@/components/contexts/StateContext';

export default function usePageHeader() {
    const { setAchievementQueryValue } = useContext(SearchContext);
    const { setShowAchievements } = useContext(StateContext);
    const [isSorted, setIsSorted] = useState(false);

    const handleClick = () => {
        setShowAchievements(false);
        setAchievementQueryValue('');
    };

    return {
        isSorted,
        setIsSorted,
        handleClick,
    };
}
