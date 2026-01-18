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

// Global error handler to suppress third-party errors (like browser extensions)
window.addEventListener('error', (event) => {
  // Suppress checkout popup errors from browser extensions
  const errorMessage = event.message || event.error?.message || ''
  if (errorMessage.includes('checkout popup config') || 
      errorMessage.includes('checkout') && errorMessage.includes('popup')) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  return true
}, true) // Use capture phase to catch errors early

// Suppress unhandled promise rejections from third-party scripts
window.addEventListener('unhandledrejection', (event) => {
  // Suppress checkout popup errors from browser extensions
  const errorMessage = event.reason?.message || event.reason?.toString() || ''
  if (errorMessage.includes('checkout popup config') || 
      (errorMessage.includes('checkout') && errorMessage.includes('popup'))) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  return true
}, true) // Use capture phase to catch errors early

// Additional console error suppression for checkout-related errors and Workbox
const originalConsoleError = console.error
console.error = function(...args) {
  const errorString = args.join(' ')
  
  // Suppress checkout popup errors from browser extensions
  if (errorString.includes('checkout popup config') || 
      (errorString.includes('checkout') && errorString.includes('popup'))) {
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

// Suppress Workbox unhandled promise rejections for API routes
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || ''
  
  // Suppress Workbox no-response errors
  if (errorMessage.includes('no-response') && 
      (errorMessage.includes('/api/') || errorMessage.includes('api.kaam247') || errorMessage.includes('kaam247.onrender.com'))) {
    event.preventDefault()
    event.stopPropagation()
    return false
  }
  
  return true
}, true)

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

