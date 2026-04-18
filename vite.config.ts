import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/quack-sort/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
