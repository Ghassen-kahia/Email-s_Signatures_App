import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { hostingPlugin } from './hosting-plugin';

export default defineConfig({
  plugins: [react(), tailwindcss(), hostingPlugin()],
  server: { port: 5173, open: true },
});
