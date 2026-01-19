import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'
import LocationPickerMap from './LocationPickerMap'
import { reverseGeocode } from '../utils/geocoding'
import ConfirmationModal from './ConfirmationModal'

function EditTaskModal({ task, isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
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
  const [shouldReAlert, setShouldReAlert] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)

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

  // Initialize form data when task changes
  useEffect(() => {
    if (task && isOpen) {
      const scheduledDate = task.scheduledAt ? new Date(task.scheduledAt) : null
      setFormData({
        title: task.title || '',
        description: task.description || '',
        category: task.category || '',
        budget: task.budget?.toString() || '',
        date: scheduledDate ? scheduledDate.toISOString().split('T')[0] : '',
        time: scheduledDate ? scheduledDate.toTimeString().slice(0, 5) : '',
        hours: task.expectedDuration?.toString() || ''
      })
      setLocationData({
        coordinates: task.location?.coordinates || null,
        area: task.location?.area || '',
        city: task.location?.city || ''
      })
      setShouldReAlert(false)
      setError(null)
      setFieldErrors({})
    }
  }, [task, isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleMapLocationChange = async (locationInfo) => {
    const { coordinates, lat, lng } = locationInfo
    
    setLocationData(prev => ({
      ...prev,
      coordinates: coordinates || prev.coordinates
    }))

    if (lat && lng) {
      try {
        const { area, city } = await reverseGeocode(lat, lng)
        setLocationData(prev => ({
          ...prev,
          area,
          city
        }))
      } catch (err) {
        console.error('Reverse geocoding error:', err)
      }
    }
  }

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    setIsGettingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLocationData(prev => ({
          ...prev,
          coordinates: [lng, lat]
        }))
        const { area, city } = await reverseGeocode(lat, lng)
        setLocationData(prev => ({
          ...prev,
          area,
          city
        }))
      } catch (err) {
        setLocationError('Unable to fetch location details. Please try again.')
      } finally {
        setIsGettingLocation(false)
      }
    }, (err) => {
      setIsGettingLocation(false)
      setLocationError(err.message || 'Unable to fetch current location.')
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    })
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!formData.category) errors.category = 'Category is required'
    if (!formData.budget || Number(formData.budget) <= 0) errors.budget = 'Budget must be greater than 0'
    if (!locationData.coordinates) errors.location = 'Location is required'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setShowConfirmModal(true)
  }

  const confirmSubmit = async () => {
    setShowConfirmModal(false)
    setIsSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem('kaam247_token')
      if (!token) {
        throw new Error('You must be logged in to edit tasks')
      }

      const user = JSON.parse(localStorage.getItem('kaam247_user') || 'null')
      if (!user?.id) {
        throw new Error('User ID not found')
      }

      // Build scheduledAt from date and time
      let scheduledAt = null
      if (formData.date) {
        if (formData.time) {
          scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString()
        } else {
          scheduledAt = new Date(`${formData.date}T12:00:00`).toISOString()
        }
      }

      const updateData = {
        posterId: user.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        budget: Number(formData.budget),
        location: {
          coordinates: locationData.coordinates,
          area: locationData.area,
          city: locationData.city
        },
        scheduledAt: scheduledAt || null,
        expectedDuration: formData.hours ? Number(formData.hours) : null,
        shouldReAlert: shouldReAlert
      }

      const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update task')
      }

      const data = await response.json()
      
      if (onSuccess) {
        onSuccess(data.task, data.reAlerted)
      }
      
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmSubmit = async () => {
    await confirmSubmit()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2000] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.title ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="e.g., Need help with cleaning"
            />
            {fieldErrors.title && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.description ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="Describe what you need help with..."
            />
            {fieldErrors.description && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.category ? 'border-red-300' : 'border-gray-300'}`}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {fieldErrors.category && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.category}</p>
            )}
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget (₹) *
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
              min="1"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.budget ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="e.g., 500"
            />
            {fieldErrors.budget && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.budget}</p>
            )}
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isGettingLocation}
              >
                {isGettingLocation ? 'Getting location…' : 'Use my current location'}
              </button>
              {locationError && (
                <span className="text-sm text-red-600">{locationError}</span>
              )}
            </div>
            <LocationPickerMap
              initialCenter={locationData.coordinates ? [
                // [lat, lng] for Leaflet display
                locationData.coordinates[1],
                locationData.coordinates[0]
              ] : undefined}
              initialZoom={13}
              onLocationChange={handleMapLocationChange}
              isGettingLocation={isGettingLocation}
            />
            {locationData.area && (
              <p className="mt-2 text-sm text-gray-600">
                📍 {locationData.area}{locationData.city ? `, ${locationData.city}` : ''}
              </p>
            )}
            {fieldErrors.location && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date (Optional)
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time (Optional)
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Expected Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Duration (Optional)
            </label>
            <select
              value={formData.hours}
              onChange={(e) => handleInputChange('hours', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {hoursOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Re-alert Workers */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={shouldReAlert}
                onChange={(e) => setShouldReAlert(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900 block mb-1">
                  Re-alert workers about this task
                </span>
                <span className="text-xs text-gray-600">
                  Workers will be notified again (only if 3+ hours have passed since last alert). This helps attract more workers if your task hasn't been accepted yet.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Task'}
            </button>
          </div>
        </form>

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={showConfirmModal}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setShowConfirmModal(false)}
          title="Update Task"
          message="Are you sure you want to update this task with the new details?"
          confirmText="Yes, Update"
          cancelText="Cancel"
          confirmColor="blue"
        />
      </div>
    </div>
  )
}

export default EditTaskModal

