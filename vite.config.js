import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // The project lives on the Windows drive (/mnt/c) and WSL gets no file
    // change events from there, so Vite has to poll or it serves stale code.
    watch: { usePolling: true, interval: 300 },
  },
});
