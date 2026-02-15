import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Fix Leaflet default marker icon issue
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// Unregister service worker in development mode for cleaner console
if (import.meta.env.DEV) {
  if ('serviceWorker' in navigator) {
    // Unregister all service workers
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => {
          // Silent fail if already unregistered
        })
      })
    }).catch(() => {
      // Silent fail if no service workers
    })
    
    // Also try to unregister by scope
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.unregister().catch(() => {
          // Silent fail
        })
      }
    }).catch(() => {
      // Silent fail
    })
  }
}

// Global error handler to suppress third-party errors (like browser extensions)
window.addEventListener('error', (event) => {
  const errorMessage = event.message || event.error?.message || ''
  const errorSource = event.filename || ''
  
  // Handle chunk/module loading errors - reload page to get fresh assets
  if (
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('Failed to load module script') ||
    errorMessage.includes('MIME type') ||
    errorSource.includes('.js') && errorMessage.includes('Failed to fetch')
  ) {
    // Clear caches and reload
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      }).then(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => registration.unregister())
            setTimeout(() => window.location.reload(), 1000)
          })
        } else {
          setTimeout(() => window.location.reload(), 1000)
        }
      }).catch(() => {
        window.location.reload()
      })
    } else {
      window.location.reload()
    }
    
    event.preventDefault()
    return false
  }
  
  // Suppress checkout popup errors from browser extensions
  if (errorMessage.includes('checkout popup config') || 
      (errorMessage.includes('checkout') && errorMessage.includes('popup'))) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  
  // Suppress only DNS resolution errors for WebSocket (expected when backend is down)
  // Allow Socket.IO to handle connection errors gracefully
  if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') && 
      (errorMessage.includes('socket.io') || errorMessage.includes('wss://') || errorMessage.includes('ws://'))) {
    // DNS errors are expected if backend is down - suppress to prevent spam
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  
  return true
}, true) // Use capture phase to catch errors early

// Suppress unhandled promise rejections from third-party scripts
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || ''
  
  // Handle chunk/module loading errors in promise rejections
  if (
    errorMessage.includes('Failed to fetch dynamically imported module') ||
    errorMessage.includes('Failed to load module script') ||
    errorMessage.includes('MIME type') ||
    errorMessage.includes('ChunkLoadError')
  ) {
    // Clear caches and reload
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
      }).then(() => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => registration.unregister())
            setTimeout(() => window.location.reload(), 1000)
          })
        } else {
          setTimeout(() => window.location.reload(), 1000)
        }
      }).catch(() => {
        window.location.reload()
      })
    } else {
      window.location.reload()
    }
    
    event.preventDefault()
    return false
  }
  
  // Suppress checkout popup errors from browser extensions
  if (errorMessage.includes('checkout popup config') || 
      (errorMessage.includes('checkout') && errorMessage.includes('popup'))) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  
  // Suppress only DNS resolution errors for WebSocket (expected when backend is down)
  // Allow Socket.IO to handle connection errors gracefully
  if (errorMessage.includes('ERR_NAME_NOT_RESOLVED') && 
      (errorMessage.includes('socket.io') || errorMessage.includes('wss://') || errorMessage.includes('ws://'))) {
    // DNS errors are expected if backend is down - suppress to prevent spam
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  
  // Suppress Workbox no-response errors for API routes (expected behavior)
  if (errorMessage.includes('no-response') && 
      (errorMessage.includes('/api/') || errorMessage.includes('api.kaam247') || errorMessage.includes('kaam247.onrender.com'))) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  
  return true
}, true) // Use capture phase to catch errors early

const root = document.getElementById('root')
ReactDOM.createRoot(root).render(<App />)

// Remove PWA splash once React has painted so the first screen is our app, not the static splash
function removePwaSplash() {
  const splash = document.getElementById('pwa-splash')
  if (splash && splash.parentNode) {
    splash.style.opacity = '0'
    splash.style.transition = 'opacity 0.2s ease-out'
    setTimeout(() => {
      if (splash.parentNode) splash.remove()
    }, 200)
  }
}
requestAnimationFrame(() => {
  requestAnimationFrame(removePwaSplash)
})

