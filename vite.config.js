// @ts-check

/** @type {import('vite').UserConfig} */
export default {
  define: {
    'process.env': {
      NODE_DEBUG: false,
    },
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        advance: 'index.mjs',
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['node:fs/promises'],
      makeAbsoluteExternalsRelative: true,
    },
  },
};
