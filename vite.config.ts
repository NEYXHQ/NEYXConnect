// ---------------------
// Normal complete build
// ---------------------

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  }
})

// // ---------------------
// //    One page build
// // ---------------------

// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import tailwindcss from 'tailwindcss';
// import path from 'path';

// export default defineConfig({
//   plugins: [react()],
//   css: {
//     postcss: {
//       plugins: [tailwindcss()],
//     },
//   },
//   build: {
//     rollupOptions: {
//       input: path.resolve(__dirname, 'src/components/connectWallet.tsx'),
//       output: {
//         entryFileNames: 'connect-wallet.js',
//         chunkFileNames: 'chunks/[name]-[hash].js',
//         assetFileNames: 'assets/[name]-[hash][extname]',
//       },
//     },
//   },
// });