import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/env'
import LocationPickerMap from '../components/LocationPickerMap'
import { persistUserLocation } from '../utils/locationPersistence'
import { reverseGeocode as reverseGeocodeViaApi } from '../utils/geocoding'

function PostTask() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    budget: '',
    date: '',
    time: '',
    hours: ''
  })
  const [locationData, setLocationData] = useState({
    coordinates: null,
    area: '',
    city: ''
  })
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]) // Bangalore default [lat, lng]
  
  // Initialize location data with default coordinates if not set
  useEffect(() => {
    if (!locationData.coordinates) {
      // Set default coordinates for Bangalore
      setLocationData(prev => ({
        ...prev,
        coordinates: [77.5946, 12.9716] // [lng, lat] - Bangalore
      }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const categories = [
    'Cleaning',
    'Delivery',
    'Helper / Labour',
    'Tutor / Mentor',
    'Tech Help',
    'Errands',
    'Event Help',
    'Custom Task'
  ]

  const hoursOptions = [
    { value: '', label: 'Select duration' },
    { value: '1', label: '1 hour' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' },
    { value: '4', label: '4 hours' },
    { value: '5', label: '5 hours' },
    { value: '6', label: '6 hours' },
    { value: '8', label: '8 hours' },
    { value: '10', label: '10 hours' },
    { value: '12', label: '12 hours' },
    { value: '24', label: 'Full day (24 hours)' }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle location change from map (marker drag or initial load)
  const handleMapLocationChange = async (locationInfo) => {
    const { coordinates, lat, lng } = locationInfo
    
    // Update location data
    setLocationData(prev => ({
      ...prev,
      coordinates: coordinates || prev.coordinates
    }))

    // Try to reverse geocode if we have coordinates
    if (lat && lng) {
      try {
        const { area, city } = await reverseGeocode(lat, lng)
        setLocationData(prev => ({
          ...prev,
          area,
          city,
          coordinates: coordinates || prev.coordinates
        }))
        setFormData(prev => ({
          ...prev,
          location: `${area}, ${city}`
        }))
      } catch (error) {
        // If reverse geocoding fails, just update coordinates
        setLocationData(prev => ({
          ...prev,
          coordinates: coordinates || prev.coordinates
        }))
      }
    }
  }

  // Reverse geocoding function to convert lat/lng to area and city
  // Uses backend proxy to avoid browser CORS + Nominatim 403 issues.
  const reverseGeocode = async (lat, lng) => {
    try {
      return await reverseGeocodeViaApi(lat, lng)
    } catch {
      // Default fallback (keep UI functional even if geocoding is down)
      return { area: 'Unknown Area', city: 'Unknown City' }
    }
  }

  // Handle "Use my current location" button click
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setIsGettingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          // Reverse geocode to get area and city
          const { area, city } = await reverseGeocode(lat, lng)
          
          // Store coordinates and location data
          setLocationData({
            coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
            area,
            city
          })
          
          // Update form location field with area and city
          setFormData(prev => ({
            ...prev,
            location: `${area}, ${city}`
          }))
          
          // Update map center to user location [lat, lng] for Leaflet
          setMapCenter([lat, lng])
          
          setIsGettingLocation(false)
        } catch (error) {
          setLocationError('Failed to get location details. You can still set location manually using the map.')
          setIsGettingLocation(false)
        }
      },
      (error) => {
        let errorMessage = 'Location access denied. '
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'You can still set location manually using the map.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'You can still set location manually using the map.'
            break
          case error.TIMEOUT:
            errorMessage += 'You can still set location manually using the map.'
            break
          default:
            errorMessage += 'You can still set location manually using the map.'
            break
        }
        setLocationError(errorMessage)
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const validateStep = (stepNum) => {
    const errors = {}
    if (stepNum === 1) {
      if (!formData.title?.trim()) errors.title = 'Task title is required'
      if (!formData.description?.trim()) errors.description = 'Description is required'
      if (!formData.category) errors.category = 'Please select a category'
    } else if (stepNum === 2) {
      if (!formData.location?.trim() && !locationData.coordinates) errors.location = 'Location is required'
      if (!formData.date) errors.date = 'Date is required'
      if (!formData.time) errors.time = 'Time is required'
      if (!formData.hours) errors.hours = 'Duration is required'

      // Prevent selecting past date/time
      if (formData.date && formData.time) {
        const selected = new Date(`${formData.date}T${formData.time}:00`)
        const now = new Date()
        if (selected.getTime() < now.getTime()) {
          errors.time = 'Time cannot be in the past'
        }
      }
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    // Validate current step before proceeding
    if (!validateStep(step)) {
      setError('Please fill in all required fields')
      return
    }
    
    setError(null) // Clear any previous errors
    setFieldErrors({}) // Clear field errors
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Convert budget input to number
  const getBudgetAmount = () => {
    return Number(formData.budget) || 0
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return
    }

    // Validate all steps before submit (includes date/time in future check)
    const step1Valid = validateStep(1)
    const step2Valid = validateStep(2)
    if (!step1Valid || !step2Valid || !formData.budget) {
      setError('Please fill in all required fields')
      return
    }

    // Validate budget
    const budgetAmount = getBudgetAmount()
    if (budgetAmount <= 0) {
      setError('Please set a valid budget')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Use authenticated user's ID
      if (!user || !user.id) {
        setError('You must be logged in to post tasks')
        setIsSubmitting(false)
        return
      }

      const userId = user.id

      // CAPTURE CURRENT LOCATION FOR PRECISION: Get fresh location right before task creation
      let finalLocation = {
        coordinates: locationData.coordinates || [77.5946, 12.9716], // Fallback to default
        area: locationData.area || formData.location?.split(',')[0]?.trim() || 'Unknown Area',
        city: locationData.city || formData.location?.split(',')[1]?.trim() || 'Unknown City'
      }

      // Try to get current location for more precision
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000, // Shorter timeout for faster task creation
            maximumAge: 0 // Always get fresh location
          })
        })

        const lat = position.coords.latitude
        const lng = position.coords.longitude

        // Reverse geocode to get area and city
        try {
          const { area, city } = await reverseGeocode(lat, lng)
          finalLocation = {
            coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
            area: area || finalLocation.area,
            city: city || finalLocation.city
          }
          
          // Persist location to user profile
          await persistUserLocation(lat, lng, area, city)
        } catch (geocodeError) {
          // If reverse geocoding fails, use coordinates but keep existing area/city if available
          finalLocation.coordinates = [lng, lat]
          // Still persist coordinates even without area/city
          await persistUserLocation(lat, lng, finalLocation.area, finalLocation.city)
        }
      } catch (locationError) {
        // Location capture failed - use existing location data
        // This is non-fatal, continue with task creation using map-selected location
      }

      // Combine date and time into scheduledAt
      let scheduledAt = null
      if (formData.date && formData.time) {
        const dateTimeString = `${formData.date}T${formData.time}:00`
        scheduledAt = new Date(dateTimeString).toISOString()
      }

      // Prepare task data with fresh location
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        budget: budgetAmount,
        scheduledAt: scheduledAt,
        expectedDuration: formData.hours ? parseInt(formData.hours) : null, // Store hours as number
        location: finalLocation,
        postedBy: userId
      }

      // Submit task to backend
      const response = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || `Server error: ${response.status} ${response.statusText}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const taskId = data.task._id

      // Redirect to task detail page
      navigate(`/tasks/${taskId}`)
    } catch (err) {
      console.error('Error creating task:', err)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to post task. Please try again.'
      
      if (err.message) {
        errorMessage = err.message
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Cannot connect to server. Please make sure the server is running.'
      }
      
      setError(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto w-full overflow-x-hidden px-4 sm:px-6">
      <form onSubmit={handleSubmit}>
        {/* Error Display */}
        {error && (
          <div className="mb-5 sm:mb-6 lg:mb-8 p-4 sm:p-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm sm:text-base text-red-700 dark:text-red-400 font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 leading-tight">What task do you need help with?</h2>
            
            <div className="space-y-5 sm:space-y-6 lg:space-y-7">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => {
                    handleInputChange('title', e.target.value)
                    if (fieldErrors.title) setFieldErrors(prev => ({ ...prev, title: null }))
                  }}
                  placeholder="e.g., Need help moving furniture"
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] ${
                    fieldErrors.title ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                  }`}
                  required
                />
                {fieldErrors.title ? (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 leading-relaxed">{fieldErrors.title}</p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">Be specific about what you need</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    handleInputChange('description', e.target.value)
                    if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: null }))
                  }}
                  placeholder="Describe your task in detail. Include any specific requirements or instructions."
                  rows={5}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors leading-relaxed ${
                    fieldErrors.description
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
                      : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                  }`}
                  required
                />
                {fieldErrors.description ? (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 leading-relaxed">{fieldErrors.description}</p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">More details help workers understand your needs</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    handleInputChange('category', e.target.value)
                    if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: null }))
                  }}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] touch-manipulation ${
                    fieldErrors.category
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
                      : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                  }`}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="text-xs sm:text-sm text-red-600 mt-1.5 leading-relaxed">{fieldErrors.category}</p>
                )}
              </div>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] touch-manipulation"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location & Time */}
        {step === 2 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 leading-tight">Where and when?</h2>
            
            <div className="space-y-5 sm:space-y-6 lg:space-y-7">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => {
                    handleInputChange('location', e.target.value)
                    if (fieldErrors.location) setFieldErrors(prev => ({ ...prev, location: null }))
                  }}
                  placeholder="e.g., Koramangala, Bangalore"
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] ${
                    fieldErrors.location
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
                      : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                  }`}
                  required
                />
                {fieldErrors.location && (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 leading-relaxed">{fieldErrors.location}</p>
                )}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isGettingLocation}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm sm:text-base text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium rounded-xl hover:bg-blue-50 transition-all duration-200 active:scale-[0.98] touch-manipulation"
                >
                  {isGettingLocation ? (
                    <>
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting location...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Use my current location
                    </>
                  )}
                </button>
                {locationError && (
                  <p className="mt-2 text-sm sm:text-base text-red-600 leading-relaxed">{locationError}</p>
                )}
                {locationData.coordinates && !locationError && (
                  <p className="mt-2 text-sm sm:text-base text-green-600 leading-relaxed">
                    ✓ Location captured: {locationData.area}, {locationData.city}
                  </p>
                )}
                
                {/* Embedded Map */}
                <div className="mt-4 sm:mt-5">
                  <LocationPickerMap
                    initialCenter={mapCenter}
                    initialZoom={13}
                    onLocationChange={handleMapLocationChange}
                    isGettingLocation={isGettingLocation}
                  />
                  <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-relaxed">
                    Drag the marker to set the exact location
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => {
                    handleInputChange('date', e.target.value)
                    if (fieldErrors.date) setFieldErrors(prev => ({ ...prev, date: null }))
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  max={(() => {
                    const maxDate = new Date()
                    maxDate.setDate(maxDate.getDate() + 2)
                    return maxDate.toISOString().split('T')[0]
                  })()}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] touch-manipulation ${
                    fieldErrors.date
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
                      : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                  }`}
                  required
                />
                {fieldErrors.date ? (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 leading-relaxed">{fieldErrors.date}</p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">Select a date within the next 2 days</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => {
                    handleInputChange('time', e.target.value)
                    if (fieldErrors.time) setFieldErrors(prev => ({ ...prev, time: null }))
                  }}
                  min={formData.date === new Date().toISOString().split('T')[0]
                    ? `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
                    : undefined}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] touch-manipulation ${
                    fieldErrors.time
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
                      : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                  }`}
                  required
                />
                {fieldErrors.time ? (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 leading-relaxed">{fieldErrors.time}</p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">Select the preferred time</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Expected Duration (Hours) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.hours}
                  onChange={(e) => {
                    handleInputChange('hours', e.target.value)
                    if (fieldErrors.hours) setFieldErrors(prev => ({ ...prev, hours: null }))
                  }}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] touch-manipulation ${
                    fieldErrors.hours
                      ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400'
                      : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
                  }`}
                  required
                >
                  {hoursOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.hours ? (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mt-1.5 leading-relaxed">{fieldErrors.hours}</p>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">How long do you expect this task to take?</p>
                )}
              </div>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm sm:text-base font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] touch-manipulation"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] touch-manipulation"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 leading-tight">Set your budget</h2>
            
            <div className="space-y-5 sm:space-y-6 lg:space-y-7">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 uppercase tracking-wide">
                  Budget (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  placeholder="Enter amount in ₹"
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px]"
                  required
                  min="1"
                />
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                  Enter the amount you are willing to pay. You can still negotiate with workers after they accept.
                </p>
              </div>
            </div>

            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 bg-gray-100 text-gray-800 text-sm sm:text-base font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[48px] sm:min-h-[52px] touch-manipulation"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 inline-flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] touch-manipulation"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : (
                  'Post Task Nearby'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default PostTask

