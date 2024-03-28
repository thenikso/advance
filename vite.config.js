// @ts-check

/** @type {import('vite').UserConfig} */
export default {
  define: {
    'process.env': {
      NODE_DEBUG: false,
    },
  },
  resolve: {
    alias: {
      'ohm-js': './ohm.js',
    },
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        advance: 'index.mjs',
        ohm: 'node_modules/ohm-js/src/main.js',
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['./ohm.js'],
      makeAbsoluteExternalsRelative: true,
    },
  },
};
