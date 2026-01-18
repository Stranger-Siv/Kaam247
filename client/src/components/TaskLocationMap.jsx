import { useEffect } from 'react'
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
    // Invalidate size when mode changes
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }, [userMode, map])

  return null
}

function TaskLocationMap({
  coordinates, // [lng, lat] format from backend
  locationName = ''
}) {
  // Don't render if coordinates are missing
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return null
  }

  // Convert [lng, lat] to [lat, lng] for Leaflet
  const [lng, lat] = coordinates
  const position = [lat, lng]

  return (
    <div className="map-wrapper relative w-full rounded-lg overflow-hidden border border-gray-200 h-[350px] sm:h-[260px]" style={{ zIndex: 1 }}>
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%', position: 'relative', zIndex: 1 }}
        scrollWheelZoom={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution="© OpenStreetMap contributors © CARTO"
        />
        <Marker
          position={position}
          draggable={false}
          icon={DefaultIcon}
        />
        <MapSizeInvalidator />
      </MapContainer>
    </div>
  )
}

export default TaskLocationMap
