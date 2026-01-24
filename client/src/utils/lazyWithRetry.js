import { lazy } from 'react'

/**
 * Wrapper for React.lazy() that adds retry logic for failed module loads
 * This handles cases where the module file might not be available (404, network issues, etc.)
 */
export function lazyWithRetry(componentImport, retries = 3, delay = 1000) {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const attemptImport = (attempt) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            // Check if it's a module loading error
            const isModuleError = 
              error?.message?.includes('Failed to fetch') ||
              error?.message?.includes('Failed to load module') ||
              error?.message?.includes('MIME type') ||
              error?.message?.includes('dynamically imported module') ||
              error?.name === 'ChunkLoadError' ||
              error?.name === 'TypeError'
            
            if (isModuleError) {
              if (attempt < retries) {
                // Clear service worker cache and retry
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                  // Try to clear cache for the failed module
                  caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                      if (cacheName.includes('js-modules') || cacheName.includes('static-assets')) {
                        caches.delete(cacheName)
                      }
                    })
                  }).catch(() => {
                    // Ignore cache clearing errors
                  })
                }
                
                // Retry after delay with exponential backoff
                const retryDelay = delay * Math.pow(2, attempt - 1)
                setTimeout(() => attemptImport(attempt + 1), retryDelay)
              } else {
                // All retries failed - clear all caches and reload
                // Clear all caches
                if ('caches' in window) {
                  caches.keys().then(cacheNames => {
                    return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
                  }).then(() => {
                    // Unregister service worker if exists
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(registrations => {
                        registrations.forEach(registration => registration.unregister())
                        // Reload after a short delay
                        setTimeout(() => window.location.reload(), 500)
                      }).catch(() => {
                        window.location.reload()
                      })
                    } else {
                      window.location.reload()
                    }
                  }).catch(() => {
                    window.location.reload()
                  })
                } else {
                  window.location.reload()
                }
                
                reject(error)
              }
            } else {
              // Not a module loading error, reject immediately
              reject(error)
            }
          })
      }
      attemptImport(1)
    })
  })
}
