import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.svg', 'icons/*.png'],
      manifestFilename: 'manifest.json',
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Exclude API routes from precaching
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
        runtimeCaching: [
          // DO NOT cache API routes - use NetworkOnly (no timeout option)
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'api-requests'
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
          // Cache static assets
          {
            urlPattern: /\.(?:js|css|html|ico|png|svg|woff2|jpg|jpeg|gif)$/,
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

