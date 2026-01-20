import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        target: ['esnext'],
        rollupOptions: {
            input: 'src/Run.ts',
            output: {
                entryFileNames: 'Run.js'
            }
        },
        sourcemap: true
    }
});
