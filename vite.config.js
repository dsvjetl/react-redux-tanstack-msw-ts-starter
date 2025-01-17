import { resolve } from 'path';
import { existsSync, unlinkSync } from 'fs';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const excludeFiles = [
  'node_modules',
  'dist',
  'coverage',
  'plop-templates',
  'public',
  '.husky',
  'src/assets',
  'src/mocks',
  'src/store',
  '**/index.js',
];

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    {
      name: 'remove-mock-worker',
      enforce: 'post',
      closeBundle() {
        if (mode === 'production') {
          // eslint-disable-next-line no-undef
          const filePath = resolve(__dirname, 'dist/mockServiceWorker.js');
          if (existsSync(filePath)) {
            unlinkSync(filePath);
            console.log('Removed mockServiceWorker.js from production build');
          }
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    include: ['src/**/*.test.{js,ts,jsx,tsx}'],
    exclude: [...excludeFiles],
    coverage: {
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [...excludeFiles],
    },
  },
}));
