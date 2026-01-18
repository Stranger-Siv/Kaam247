import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/env'
import LocationPickerMap from '../components/LocationPickerMap'

function PostTask() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [customBudget, setCustomBudget] = useState('')
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
  const [postingLimitReached, setPostingLimitReached] = useState(false)
  const [checkingLimit, setCheckingLimit] = useState(false)
  
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

  const budgetRanges = [
    'Under ₹500',
    '₹500 - ₹1000',
    '₹1000 - ₹2000',
    '₹2000 - ₹5000',
    'Above ₹5000',
    'Custom amount'
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
  const reverseGeocode = async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Kaam247/1.0'
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }
      
      const data = await response.json()
      const address = data.address || {}
      
      // Extract area and city from address components
      const area = address.suburb || address.neighbourhood || address.road || address.locality || 'Unknown Area'
      const city = address.city || address.town || address.county || address.state || 'Unknown City'
      
      return { area, city }
    } catch (error) {
      // Fallback: Use a simple mapping based on coordinates (for India)
      // This is a basic fallback - in production, you might want a more sophisticated solution
      if (lat >= 12.8 && lat <= 13.1 && lng >= 77.4 && lng <= 77.8) {
        return { area: 'Bangalore', city: 'Bangalore' }
      }
      // Default fallback
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

  // Convert budget range to number
  const getBudgetAmount = () => {
    if (formData.budget === 'Custom amount') {
      return Number(customBudget) || 0
    }
    
    // Extract number from range strings
    const budgetMap = {
      'Under ₹500': 400,
      '₹500 - ₹1000': 750,
      '₹1000 - ₹2000': 1500,
      '₹2000 - ₹5000': 3500,
      'Above ₹5000': 6000
    }
    
    return budgetMap[formData.budget] || 0
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return
    }

    // Validate required fields
    if (!formData.title || !formData.description || !formData.category || !formData.budget || !formData.date || !formData.time || !formData.hours) {
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
        } catch (geocodeError) {
          // If reverse geocoding fails, use coordinates but keep existing area/city if available
          finalLocation.coordinates = [lng, lat]
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
        
        // Handle rate limit (429)
        if (response.status === 429) {
          setPostingLimitReached(true)
        }
        
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
    <div className="max-w-3xl mx-auto w-full overflow-x-hidden px-0 sm:px-6">
      <form onSubmit={handleSubmit}>
        {/* Error Display */}
        {error && (
          <div className="mb-4 sm:mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="bg-white rounded-none sm:rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 border-0 sm:border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">What task do you need help with?</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 min-h-[44px] ${
                    fieldErrors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {fieldErrors.title ? (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Be specific about what you need</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    handleInputChange('description', e.target.value)
                    if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: null }))
                  }}
                  placeholder="Describe your task in detail. Include any specific requirements or instructions."
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                    fieldErrors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {fieldErrors.description ? (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.description}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">More details help workers understand your needs</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    handleInputChange('category', e.target.value)
                    if (fieldErrors.category) setFieldErrors(prev => ({ ...prev, category: null }))
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 min-h-[44px] ${
                    fieldErrors.category ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {fieldErrors.category && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.category}</p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] min-w-[100px]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location & Time */}
        {step === 2 && (
          <div className="bg-white rounded-none sm:rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 border-0 sm:border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Where and when?</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 min-h-[44px] ${
                    fieldErrors.location ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {fieldErrors.location && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.location}</p>
                )}
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isGettingLocation}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGettingLocation ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting location...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Use my current location
                    </>
                  )}
                </button>
                {locationError && (
                  <p className="mt-2 text-sm text-red-600">{locationError}</p>
                )}
                {locationData.coordinates && !locationError && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Location captured: {locationData.area}, {locationData.city}
                  </p>
                )}
                
                {/* Embedded Map */}
                <div className="mt-4">
                  <LocationPickerMap
                    initialCenter={mapCenter}
                    initialZoom={13}
                    onLocationChange={handleMapLocationChange}
                    isGettingLocation={isGettingLocation}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Drag the marker to set the exact location
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 min-h-[44px] ${
                    fieldErrors.date ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {fieldErrors.date ? (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.date}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Select a date within the next 2 days</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => {
                    handleInputChange('time', e.target.value)
                    if (fieldErrors.time) setFieldErrors(prev => ({ ...prev, time: null }))
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 min-h-[44px] ${
                    fieldErrors.time ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {fieldErrors.time ? (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.time}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Select the preferred time</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Duration (Hours) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.hours}
                  onChange={(e) => {
                    handleInputChange('hours', e.target.value)
                    if (fieldErrors.hours) setFieldErrors(prev => ({ ...prev, hours: null }))
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 min-h-[44px] ${
                    fieldErrors.hours ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
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
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.hours}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">How long do you expect this task to take?</p>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between gap-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors min-h-[44px] min-w-[100px]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] min-w-[100px]"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Budget */}
        {step === 3 && (
          <div className="bg-white rounded-none sm:rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 border-0 sm:border border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Set your budget</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Range <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {budgetRanges.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => handleInputChange('budget', range)}
                      className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.budget === range
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
                {formData.budget === 'Custom amount' && (
                  <input
                    type="number"
                    value={customBudget}
                    onChange={(e) => setCustomBudget(e.target.value)}
                    placeholder="Enter amount in ₹"
                    className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={formData.budget === 'Custom amount'}
                    min="1"
                  />
                )}
                <p className="text-xs text-gray-500 mt-2">You can negotiate with workers after they accept</p>
              </div>
            </div>

            <div className="mt-8 flex justify-between gap-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[100px]"
              >
                Back
              </button>
              {postingLimitReached && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 mb-1">Daily Posting Limit Reached</p>
                      <p className="text-sm text-yellow-700">You have reached the daily task posting limit (5 tasks). Try again tomorrow.</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting || postingLimitReached}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px] min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Posting...
                  </>
                ) : postingLimitReached ? (
                  'Limit Reached'
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

