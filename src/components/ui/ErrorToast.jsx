import { Fragment } from 'react';
import ExtLink from '@/components/ui/ExtLink';

export default function ErrorToast({ message, href }) {
    return (
        <Fragment>
            <div className='flex flex-col gap-1'>
                <p>
                    {message}
                </p>
                <ExtLink href={href}>
                    <p className='text-link hover:text-linkhover'>
                        Learn more
                    </p>
                </ExtLink>
            </div>
        </Fragment>
    );
}