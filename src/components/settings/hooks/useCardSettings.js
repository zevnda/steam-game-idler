import { useEffect, useState } from 'react';
import { getStoredCookies } from '../utils/cardSettingsHandler';

export default function useCardSettings(settings) {
    const [sidValue, setSidValue] = useState('');
    const [slsValue, setSlsValue] = useState('');
    const [smaValue, setSmaValue] = useState('');
    const [hasCookies, setHasCookies] = useState(false);
    const [localSettings, setLocalSettings] = useState(null);
    const [cardFarmingUser, setCardFarmingUser] = useState(null);

    useEffect(() => {
        if (settings && settings.cardFarming) {
            setLocalSettings(settings);
        }
    }, [settings]);

    useEffect(() => {
        getStoredCookies(setHasCookies, setSidValue, setSlsValue, setSmaValue, setCardFarmingUser);
    }, []);

    const handleSidChange = (e) => {
        setSidValue(e.target.value);
    };

    const handleSlsChange = (e) => {
        setSlsValue(e.target.value);
    };

    const handleSmaChange = (e) => {
        setSmaValue(e.target.value);
    };

    return {
        sidValue,
        slsValue,
        smaValue,
        hasCookies,
        setSidValue,
        setSlsValue,
        setSmaValue,
        setHasCookies,
        localSettings,
        setLocalSettings,
        handleSidChange,
        handleSlsChange,
        handleSmaChange,
        cardFarmingUser,
        setCardFarmingUser,
    };
}
