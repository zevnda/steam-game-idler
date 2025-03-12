import { useContext, useState } from 'react';
import { StateContext } from '@/components/contexts/StateContext';

export default function usePageHeader() {
    const { setShowAchievements } = useContext(StateContext);
    const [isSorted, setIsSorted] = useState(false);

    const handleClick = () => {
        setShowAchievements(false);
    };

    return {
        isSorted,
        setIsSorted,
        handleClick,
    };
}
