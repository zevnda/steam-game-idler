import { Button } from '@heroui/react';
import React from 'react';

import ExtLink from '@/components/ui/ExtLink';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error,
            errorInfo
        });

        console.error('Client side error caught by ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            const { error, errorInfo } = this.state;

            const issueTitle = error && error.toString();
            const issueBody = `### Description
<give a brief description of what you were doing when the error occurred>

### Steps to reproduce
<give a step-by-step description of how to reproduce the error>

### Stack
\`\`\`
${errorInfo && errorInfo.componentStack}
\`\`\``;
            const encodedTitle = encodeURIComponent(issueTitle);
            const encodedBody = encodeURIComponent(issueBody);

            return (
                <div className='bg-base h-screen w-screen'>
                    <div className='absolute top-0 left-0 w-full h-12 flex justify-center items-center bg-titlebar select-none' data-tauri-drag-region>
                        <p className='text-sm'>
                            Uh-oh!
                        </p>
                    </div>

                    <div className='flex flex-col items-center justify-center gap-2 h-full'>
                        <div className='flex flex-col justify-center gap-4 h-[65%] w-[70%] bg-container rounded-lg border border-border p-4'>
                            <p className='text-sm'>
                                An error occurred while rendering the application
                            </p>

                            <div className='flex flex-col'>
                                <p>Error</p>
                                <p className='text-sm font-mono text-danger font-semibold'>
                                    {error && error.toString().replace('Error: ', '')}
                                </p>
                            </div>

                            <div className='flex flex-col overflow-hidden'>
                                <p>Stack</p>
                                <div className='bg-base border border-border rounded-lg h-full w-full p-1 overflow-hidden'>
                                    <div className='overflow-y-scroll h-full'>
                                        <pre className='text-xs font-semibold text-left text-wrap p-1'>
                                            {errorInfo && errorInfo.componentStack}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='flex gap-4'>
                            <ExtLink
                                href={`https://github.com/zevnda/steam-game-idler/issues/new?title=${encodedTitle}&body=${encodedBody}`}
                            >
                                <div className='bg-warning p-2 font-semibold rounded-lg text-button'>
                                    <p className='text-xs'>
                                        Report on GitHub
                                    </p>
                                </div>
                            </ExtLink>

                            <Button
                                size='sm'
                                className='font-semibold rounded-lg bg-dynamic text-button'
                                onPress={() => window.location.reload()}
                            >
                                Reload
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;