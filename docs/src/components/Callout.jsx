import { Callout as CustomCallout } from 'nextra/components';
import { BiSolidErrorAlt } from 'react-icons/bi';
import { IoInformationCircle } from 'react-icons/io5';
import { TiWarning } from 'react-icons/ti';

const icons = {
    info: <IoInformationCircle fontSize={26} />,
    error: <BiSolidErrorAlt fontSize={26} />,
    warning: <TiWarning fontSize={26} />,
};

export default function Callout({ children, type }) {
    return (
        <CustomCallout type={type} emoji={icons[type] || icons.warning}>
            {children}
        </CustomCallout>
    );
}
