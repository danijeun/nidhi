import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the build works under GitHub Pages' /nidhi/ sub-path.
  base: './',
  server: {
    // The project lives on the Windows drive (/mnt/c) and WSL gets no file
    // change events from there, so Vite has to poll or it serves stale code.
    watch: { usePolling: true, interval: 300 },
  },
});
