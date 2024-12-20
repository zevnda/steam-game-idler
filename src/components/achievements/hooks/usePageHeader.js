import { useState } from 'react';

export default function usePageHeader({ setShowAchievements, setInputValue }) {
    const [isSorted, setIsSorted] = useState(false);

    const handleClick = () => {
        setShowAchievements(false);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    return {
        isSorted,
        setIsSorted,
        handleClick,
        handleInputChange
    };
}
