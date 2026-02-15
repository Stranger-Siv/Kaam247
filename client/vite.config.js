import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Do NOT auto-register service worker in production to avoid unexpected reload loops.
      // Manifest/icons are still generated, but SW is only registered if you manually do it.
      injectRegister: null,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.svg', 'icons/kaam247_pwa_new.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifestFilename: 'manifest.json',
      // Disable PWA service worker in development for cleaner console
      // PWA will still work in production builds
      devOptions: {
        enabled: false, // Disable SW in dev to suppress Workbox logs
        type: 'module',
      },
      manifest: {
        name: 'Kaam247',
        short_name: 'Kaam247',
        description: 'Hyperlocal task marketplace - Get local help for everyday tasks',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/kaam247_pwa_new.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/kaam247_pwa_new.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Don't precache index.html so we can serve fresh HTML when online (splash, meta, etc.)
        globPatterns: ['**/*.{js,css,ico,png,svg,woff2}'],
        globIgnores: ['**/index.html', '**/kaam247_pwa_1.png'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MiB for other assets
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Document (index.html): NetworkFirst so PWA gets fresh splash/shell when online
          {
            urlPattern: ({ request }) => request.mode === 'navigate' || request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'document-cache',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          // DO NOT cache API routes - use NetworkOnly (no timeout option)
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'api-requests',
              fetchOptions: {
                cache: 'no-store'
              }
            }
          },
          // DO NOT cache Socket.IO connections
          {
            urlPattern: /^https?:\/\/.*\/socket\.io\/.*/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'socket-requests'
            }
          },
          // Use NetworkFirst for JS modules to always get latest version
          {
            urlPattern: /\.(?:js|mjs)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'js-modules',
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200]
              },
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day - shorter cache for modules
              }
            }
          },
          // Cache geocoding API (read-only, safe to cache)
          {
            urlPattern: /^https:\/\/nominatim\.openstreetmap\.org\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'geocoding-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache other static assets
          {
            urlPattern: /\.(?:css|html|ico|png|svg|woff2|jpg|jpeg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
})

