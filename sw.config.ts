import { defineConfig } from 'vite';

//config file for service worker un /public
//said worker is to aid in the embedding of a game.

export default defineConfig({
    build: {
        lib: {
            entry: 'src/sw.ts',
            name: 'sw',
            fileName: 'sw',
            formats: ['es'],
        },
        outDir: 'public',
        emptyOutDir: false,
    },
});