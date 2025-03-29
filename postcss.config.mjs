/** @type {import('postcss-load-config').Config} */
const config = {
    plugins: {
        tailwindcss: {},
        cssnano: {
            preset: ['default', { discardComments: { removeAll: true } }],
        }
    },
};

export default config;
