import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

function generateFirebaseSw(contentFromTemplate) {
  let content = contentFromTemplate
  FIREBASE_ENV_KEYS.forEach((key) => {
    const placeholder = `__${key}__`
    const value = typeof process.env[key] === 'string' ? process.env[key] : ''
    content = content.split(placeholder).join(value)
  })
  return content
}

/** Generate firebase-messaging-sw.js from template so API keys are never committed. */
function firebaseSwPlugin() {
  const templatePath = join(__dirname, 'firebase-messaging-sw.template.js')
  return {
    name: 'firebase-messaging-sw',
    configureServer() {
      const template = readFileSync(templatePath, 'utf-8')
      const outPath = join(__dirname, 'public', 'firebase-messaging-sw.js')
      writeFileSync(outPath, generateFirebaseSw(template), 'utf-8')
    },
    writeBundle(options) {
      const outDir = resolve(__dirname, options.dir || 'dist')
      const template = readFileSync(templatePath, 'utf-8')
      const outPath = join(outDir, 'firebase-messaging-sw.js')
      writeFileSync(outPath, generateFirebaseSw(template), 'utf-8')
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    firebaseSwPlugin(),
    VitePWA({
      // Do NOT auto-register service worker in production to avoid unexpected reload loops.
      // Manifest/icons are still generated, but SW is only registered if you manually do it.
      injectRegister: null,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.svg', 'icons/kaam247_pwa.jpeg', 'icons/icon-192.png', 'icons/icon-512.png'],
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
            src: '/icons/kaam247_pwa.jpeg',
            sizes: '192x192',
            type: 'image/jpeg',
            purpose: 'any maskable'
          },
          {
            src: '/icons/kaam247_pwa.jpeg',
            sizes: '512x512',
            type: 'image/jpeg',
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

