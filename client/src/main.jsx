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
    console.error('Chunk loading error detected, clearing cache and reloading...', {
      message: errorMessage,
      source: errorSource
    })
    
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
    console.error('Chunk loading error in promise rejection, clearing cache and reloading...', errorMessage)
    
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

// Suppress ALL Workbox debug logs (verbose router messages)
const originalConsoleLog = console.log
console.log = function(...args) {
  const logString = args.join(' ')
  
  // Suppress ALL Workbox messages (router, cache, network, etc.)
  if (logString.toLowerCase().includes('workbox')) {
    return
  }
  
  // Call original console.log for other messages
  originalConsoleLog.apply(console, args)
}

// Additional console error suppression for checkout-related errors, Workbox, and Socket.IO
const originalConsoleError = console.error
console.error = function(...args) {
  const errorString = args.join(' ')
  
  // Suppress checkout popup errors from browser extensions
  if (errorString.includes('checkout popup config') || 
      (errorString.includes('checkout') && errorString.includes('popup'))) {
    return
  }
  
  // Suppress only DNS resolution errors for WebSocket (expected when backend is down)
  // Allow Socket.IO to log connection errors for debugging
  if (errorString.includes('ERR_NAME_NOT_RESOLVED') && 
      (errorString.includes('socket.io') || errorString.includes('wss://') || errorString.includes('ws://'))) {
    return
  }
  
  // Suppress Workbox no-response errors for API routes (expected behavior)
  if (errorString.includes('no-response') && 
      (errorString.includes('/api/') || errorString.includes('api.kaam247') || errorString.includes('kaam247.onrender.com'))) {
    // This is expected - API routes use NetworkOnly strategy
    return
  }
  
  // Suppress Workbox FetchEvent errors for API routes
  if (errorString.includes('FetchEvent') && 
      (errorString.includes('/api/') || errorString.includes('network error'))) {
    return
  }
  
  // Call original console.error for other errors
  originalConsoleError.apply(console, args)
}

// Suppress React DevTools suggestion message and React Router warnings
const originalConsoleWarn = console.warn
console.warn = function(...args) {
  const warnString = args.join(' ')
  
  // Suppress React DevTools download suggestion
  if (warnString.includes('Download the React DevTools') || 
      warnString.includes('reactjs.org/link/react-devtools')) {
    return
  }
  
  // Suppress React Router future flag warnings (we've already enabled the flags)
  if (warnString.includes('React Router Future Flag Warning') ||
      warnString.includes('v7_startTransition') ||
      warnString.includes('v7_relativeSplatPath')) {
    return
  }
  
  // Call original console.warn for other warnings
  originalConsoleWarn.apply(console, args)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

