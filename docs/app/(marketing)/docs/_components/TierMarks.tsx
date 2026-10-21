import { FaCheck, FaXmark } from 'react-icons/fa6'

// Check/cross marks for pro.mdx's tier comparison table. Lives here rather than as inline
// `export const` components in the .mdx itself - the real MDX compiler accepts those fine, but the
// VS Code MDX extension misreads JSX inside an MDX `export` and flags it as "Unexpected
// `ExpressionStatement` in code: only import/exports are supported".
export const Yes = () => <FaCheck className='text-green-500 inline' />
export const No = () => <FaXmark className='text-red-400/50 inline' />
