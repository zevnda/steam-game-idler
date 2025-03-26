import { FiLogOut } from 'react-icons/fi';
import {
    TbAward,
    TbCards,
    TbDeviceGamepad2,
    TbDotsVertical,
    TbGift,
    TbHeart,
    TbHourglassLow,
    TbPlayerPlay,
    TbPlayerPlayFilled,
    TbSettings
} from 'react-icons/tb';

export default function Icon({ type }) {
    const iconStyles = {
        display: 'inline',
        marginInline: 4,
        padding: 3,
        borderRadius: 4,
    };

    return (
        <>
            {type === 'game' && (
                <TbDeviceGamepad2
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black"
                />
            )}
            {type === 'play' && (
                <TbPlayerPlay
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black"
                />
            )}
            {type === 'cards' && (
                <TbCards
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black"
                />
            )}
            {type === 'award' && (
                <TbAward
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black"
                />
            )}
            {type === 'hourglass' && (
                <TbHourglassLow
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black"
                />
            )}
            {type === 'heart' && (
                <TbHeart
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black"
                />
            )}
            {type === 'gift' && (
                <TbGift
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black"
                />
            )}
            {type === 'playalt' && (
                <TbPlayerPlayFilled
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black"
                />
            )}
            {type === 'cog' && (
                <TbSettings
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black"
                />
            )}
            {type === 'dots' && (
                <TbDotsVertical
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black"
                />
            )}
            {type === 'signout' && (
                <FiLogOut
                    fontSize={24}
                    style={iconStyles}
                    className="shadow-sm bg-[#eff4f7] text-black rotate-180"
                />
            )}
        </>
    );
}
