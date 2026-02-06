import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { RETURN_URL_PARAM } from '../utils/authIntents'
import { API_BASE_URL } from '../config/env'
import { useCategories } from '../hooks/useCategories'
import { usePWAInstall } from '../context/PWAInstallContext'
import { STUDENT_TASK_TEMPLATES } from '../config/studentTemplates'
import LocationPickerMap from '../components/LocationPickerMap'
import LoginCTA from '../components/LoginCTA'
import { persistUserLocation } from '../utils/locationPersistence'
import { reverseGeocode as reverseGeocodeViaApi } from '../utils/geocoding'

function PostTask() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    fullAddress: '',
    budget: '',
    hours: '',
    validForDays: '7',
    isOnCampus: false
  })
  const [locationData, setLocationData] = useState({
    coordinates: null,
    area: '',
    city: ''
  })
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [mapCenter, setMapCenter] = useState([12.9716, 77.5946]) // Bangalore default [lat, lng]
  const [platformCommissionPercent, setPlatformCommissionPercent] = useState(0)
  const [templatesExpanded, setTemplatesExpanded] = useState(false)

  // Load template from URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const templateParam = params.get('template')
    if (templateParam) {
      try {
        const template = JSON.parse(decodeURIComponent(templateParam))
        setFormData({
          title: template.title || '',
          description: template.description || '',
          category: template.category || '',
          location: template.location?.area && template.location?.city
            ? `${template.location.area}, ${template.location.city}`
            : '',
          fullAddress: template.location?.fullAddress || '',
          budget: template.budget?.toString() || '',
          hours: template.expectedDuration?.toString() || '',
          validForDays: '7'
        })
        if (template.location?.area && template.location?.city) {
          setLocationData({
            coordinates: null, // Will be set when user selects location on map
            area: template.location.area,
            city: template.location.city
          })
        }
      } catch (err) {
        // Invalid template data, ignore
      }
    }
  }, [location.search])

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

  const { categories } = useCategories()
  const { requestShow: requestPWAInstall } = usePWAInstall()

  // Fetch platform commission percent (public config)
  useEffect(() => {
    const fetchCommission = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/platform-config`)
        if (!res.ok) return
        const data = await res.json().catch(() => ({}))
        if (typeof data.platformCommissionPercent === 'number') {
          setPlatformCommissionPercent(data.platformCommissionPercent)
        }
      } catch {
        // ignore, default 0%
      }
    }
    fetchCommission()
  }, [])

  const validForDaysOptions = [
    { value: '1', label: '1 day' },
    { value: '3', label: '3 days' },
    { value: '7', label: '7 days (default)' },
    { value: '14', label: '14 days (max)' }
  ]

  // College pilot: 30 min, 1 hr, same day, custom (hours)
  const hoursOptions = [
    { value: '', label: 'Select duration' },
    { value: '0.5', label: '30 minutes' },
    { value: '1', label: '1 hour' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' },
    { value: '6', label: '6 hours' },
    { value: '12', label: 'Same day (12 hours)' },
    { value: '24', label: 'Same day (24 hours)' },
    { value: '48', label: 'Custom (2 days)' }
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

    // Validate all steps before submit
    const step1Valid = validateStep(1)
    const step2Valid = validateStep(2)
    if (!step1Valid || !step2Valid || !formData.budget) {
      setError('Please fill in all required fields')
      return
    }

    // Validate budget (minimum ₹50)
    const budgetAmount = getBudgetAmount()
    if (budgetAmount < 50) {
      setError('Minimum budget is ₹50')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      if (!user || !user.id) {
        setIsSubmitting(false)
        const returnUrl = '/post-task' + (location.search || '')
        navigate(`/login?${RETURN_URL_PARAM}=${encodeURIComponent(returnUrl)}&message=poster`)
        return
      }

      const userId = user.id

      // CAPTURE CURRENT LOCATION FOR PRECISION: Get fresh location right before task creation
      let finalLocation = {
        coordinates: locationData.coordinates || [77.5946, 12.9716], // Fallback to default
        area: locationData.area || formData.location?.split(',')[0]?.trim() || 'Unknown Area',
        city: locationData.city || formData.location?.split(',')[1]?.trim() || 'Unknown City',
        fullAddress: formData.fullAddress?.trim() || null
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
            city: city || finalLocation.city,
            fullAddress: finalLocation.fullAddress ?? null
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

      // Prepare task data with fresh location (createdAt is set by the server)
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        budget: budgetAmount,
        expectedDuration: formData.hours ? parseFloat(formData.hours) : null,
        location: finalLocation,
        postedBy: userId,
        validForDays: formData.validForDays ? parseInt(formData.validForDays, 10) : 7,
        isOnCampus: formData.isOnCampus === true
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

      // After first task post: encourage PWA install
      requestPWAInstall()

      // Optionally save as template (non-blocking)
      if (saveAsTemplate) {
        try {
          const token = localStorage.getItem('kaam247_token')
          if (token) {
            const templatePayload = {
              name: (templateName || formData.title || 'Task template').trim().slice(0, 50),
              title: formData.title.trim(),
              description: formData.description.trim(),
              category: formData.category,
              budget: budgetAmount,
              expectedDuration: formData.hours ? parseInt(formData.hours) : null,
              location: finalLocation
            }

            await fetch(`${API_BASE_URL}/api/users/me/templates`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(templatePayload)
            }).catch(() => { })
          }
        } catch {
          // Ignore template save errors so posting is not blocked
        }
      }

      // Redirect to task detail page
      navigate(`/tasks/${taskId}`)
    } catch (err) {
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

  // No separate template save step anymore – handled inside handleSubmit when saveAsTemplate is true

  return (
    <div className="max-w-3xl mx-auto w-full overflow-x-hidden px-4 sm:px-6">
      <form onSubmit={handleSubmit}>
        <div className="mb-5 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Create your first task
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Describe what you need help with, set a fair budget, and choose when & where.
          </p>
          <div className="mt-3 sm:mt-4 rounded-xl border border-emerald-300 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
            <p className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              We are currently charging <span className="underline">{platformCommissionPercent}% commission</span> on tasks.
            </p>
            <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 mt-1">
              Workers receive approximately <span className="font-semibold">{Math.max(0, 100 - platformCommissionPercent)}%</span> of the task budget.
            </p>
          </div>
        </div>
        {/* Error Display */}
        {error && (
          <div className="mb-5 sm:mb-6 lg:mb-8 p-4 sm:p-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm sm:text-base text-red-700 dark:text-red-400 font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 leading-tight">What task do you need help with?</h2>

            {/* Student task templates - collapsible to save space on small screens */}
            <div className="mb-4 sm:mb-6">
              <button
                type="button"
                onClick={() => setTemplatesExpanded(prev => !prev)}
                className="flex items-center justify-between w-full py-2 pr-1 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors touch-manipulation"
                aria-expanded={templatesExpanded}
                aria-controls="post-task-templates-list"
              >
                <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Quick start from template
                </span>
                <span
                  className={`shrink-0 ml-2 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${templatesExpanded ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              <div
                id="post-task-templates-list"
                className={`overflow-hidden transition-all duration-200 ease-out ${templatesExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                aria-hidden={!templatesExpanded}
              >
                <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                  {STUDENT_TASK_TEMPLATES.map((t) => (
                    <button
                      key={`${t.title}-${t.category}`}
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          title: t.title,
                          description: t.description,
                          category: t.category,
                          budget: t.budget?.toString() ?? prev.budget,
                          hours: t.expectedDuration?.toString() ?? prev.hours
                        }))
                        if (fieldErrors.title || fieldErrors.description || fieldErrors.category) {
                          setFieldErrors(prev => ({ ...prev, title: null, description: null, category: null }))
                        }
                      }}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 text-[11px] sm:text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] ${fieldErrors.title ? 'border-red-300 dark:border-red-600 focus:ring-red-500 dark:focus:ring-red-400' : 'border-gray-200 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'
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
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors leading-relaxed ${fieldErrors.description
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
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] touch-manipulation ${fieldErrors.category
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

            {/* Save as template option */}
            <div className="mt-8 sm:mt-9 border-t border-dashed border-gray-200 dark:border-gray-700 pt-4 sm:pt-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Save this setup as a template
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Next time you can start from this task instead of filling everything again.
                  </p>
                  {saveAsTemplate && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Template name (optional, e.g., Weekly Cleaning)"
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        maxLength={50}
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 leading-tight">Where?</h2>

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
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] ${fieldErrors.location
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

                <div className="mt-4 sm:mt-5">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isOnCampus === true}
                      onChange={(e) => setFormData(prev => ({ ...prev, isOnCampus: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">This task is on campus</span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tasks are shown to users within 2 km. Tick if location is on campus.</p>
                </div>
                <div className="mt-4 sm:mt-5">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                    Full address (optional)
                  </label>
                  <textarea
                    value={formData.fullAddress}
                    onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                    placeholder="Room no, flat no, building name, landmark, etc."
                    rows={3}
                    className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors resize-y min-h-[80px]"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Helps the worker find you (e.g. Block A, 3rd floor, near XYZ)</p>
                </div>

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
                  Expected Duration (Hours) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.hours}
                  onChange={(e) => {
                    handleInputChange('hours', e.target.value)
                    if (fieldErrors.hours) setFieldErrors(prev => ({ ...prev, hours: null }))
                  }}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] touch-manipulation ${fieldErrors.hours
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

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Task listing valid for
                </label>
                <select
                  value={formData.validForDays}
                  onChange={(e) => handleInputChange('validForDays', e.target.value)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] touch-manipulation"
                >
                  {validForDaysOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">After this period the task will no longer appear in search</p>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 leading-tight">Set your budget</h2>

            <div className="space-y-5 sm:space-y-6 lg:space-y-7">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Budget (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  placeholder="Enter amount (min ₹50)"
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px]"
                  required
                  min="50"
                />
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                  Minimum ₹50. Enter the amount you are willing to pay.
                </p>
              </div>
            </div>

            {!user?.id && (
              <div className="mt-6 mb-4">
                <LoginCTA message="Login to post this task and track its progress" returnUrl={'/post-task' + (location.search || '')} />
              </div>
            )}
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

