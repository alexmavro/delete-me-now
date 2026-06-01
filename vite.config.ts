import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sri from 'vite-plugin-subresource-integrity';

// SRI adds integrity hashes to script + link tags. Combined with strict CSP,
// a swapped bundle on the CDN gets rejected by the browser instead of
// executing.
export default defineConfig({
  plugins: [react(), sri()],
  // Absolute base required for SRI plugin to resolve asset paths correctly.
  base: '/',
  build: {
    outDir: 'dist',
  },
  server: {
    // Localhost-only by default. CI / Replit-style sandboxes that need to
    // bind 0.0.0.0 can override via VITE_DEV_HOST without baking the
    // DNS-rebinding-protection bypass into the source.
    host: process.env.VITE_DEV_HOST || 'localhost',
    port: 5000,
    allowedHosts: process.env.VITE_DEV_HOST ? true : ['localhost', '127.0.0.1'],
  },
});
