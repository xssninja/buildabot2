import { resolve } from 'path';
import { defineConfig } from 'vite';

// Three pages: hub (front page), the Build-A-Bot workshop, and DIY + Subscriptions
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        builder: resolve(__dirname, 'builder.html'),
        paths: resolve(__dirname, 'paths.html')
      }
    }
  }
});
