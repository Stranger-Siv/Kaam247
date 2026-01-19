import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { useUserMode } from '../context/UserModeContext'
import L from 'leaflet'

// Fix marker icon
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to invalidate map size on mode change
function MapSizeInvalidator() {
  const map = useMap()
  const { userMode } = useUserMode()

  useEffect(() => {
    // Invalidate size when mode changes.
    // Guard + cleanup to avoid calling into Leaflet after unmount (causes _leaflet_pos errors).
    let cancelled = false
    const t = setTimeout(() => {
      if (cancelled) return
      try {
        map?.invalidateSize?.()
      } catch {
        // ignore
      }
    }, 100)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [userMode, map])

  return null
}

function LocationPickerMap({
  initialCenter = [12.9716, 77.5946], // Bangalore default [lat, lng]
  initialZoom = 13,
  onLocationChange,
  isGettingLocation = false
}) {
  const [position, setPosition] = useState(initialCenter)
  const [mapKey, setMapKey] = useState(0)

  // Update position when initialCenter changes (e.g., from "Use my location")
  useEffect(() => {
    if (initialCenter && initialCenter[0] && initialCenter[1]) {
      setPosition(initialCenter)
      // Force map re-render with new center by updating key
      setMapKey(prev => prev + 1)
    }
  }, [initialCenter])

  // Handle marker drag end
  const handleMarkerDragEnd = (e) => {
    const newPosition = e.target.getLatLng()
    const lat = newPosition.lat
    const lng = newPosition.lng
    const coords = [lng, lat] // [lng, lat] format for backend
    const newPos = [lat, lng] // [lat, lng] for Leaflet display

    setPosition(newPos)

    // Notify parent component
    if (onLocationChange) {
      onLocationChange({
        coordinates: coords,
        lat: lat,
        lng: lng
      })
    }
  }

  // Always render map with default position if needed
  const displayPosition = position && position[0] && position[1]
    ? position
    : [12.9716, 77.5946] // Default to Bangalore

  return (
    <div className="map-wrapper relative w-full rounded-lg overflow-hidden border border-gray-300 h-[250px] sm:h-[350px]" style={{ zIndex: 1 }}>
      {isGettingLocation && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Getting your location...</p>
          </div>
        </div>
      )}
      <MapContainer
        key={mapKey}
        center={displayPosition}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="© OpenStreetMap contributors © CARTO"
        />
        <Marker
          position={displayPosition}
          draggable={true}
          icon={DefaultIcon}
          eventHandlers={{
            dragend: handleMarkerDragEnd
          }}
        />
        <MapSizeInvalidator />
      </MapContainer>
    </div>
  )
}

export default LocationPickerMap
