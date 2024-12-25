import { useContext, useState } from 'react';
import { AppContext } from '../../layout/components/AppContext';

export default function usePageHeader() {
    const { setShowAchievements } = useContext(AppContext);
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
