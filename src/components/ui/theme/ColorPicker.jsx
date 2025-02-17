import { Fragment } from 'react';
import { useColor } from '@/src/components/layout/ColorContext';
import { HexColorPicker } from 'react-colorful';

export default function ColorPicker() {
    const { themeColor, updateColor } = useColor();

    return (
        <Fragment>
            <HexColorPicker color={themeColor} onChange={updateColor} />
        </Fragment>
    );
}