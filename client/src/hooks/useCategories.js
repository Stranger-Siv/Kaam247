import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'

const DEFAULT_CATEGORIES = [
  'Cleaning',
  'Delivery',
  'Helper / Labour',
  'Tutor / Mentor',
  'Tech Help',
  'Errands',
  'Event Help',
  'Custom Task'
]

/**
 * Fetches task categories from API. Falls back to DEFAULT_CATEGORIES on error.
 * @returns {{ categories: string[], loading: boolean, error: string|null }}
 */
export function useCategories() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`)
        if (!response.ok) throw new Error('Failed to fetch categories')
        const data = await response.json()
        if (!cancelled && Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories.filter((c) => c != null && String(c).trim() !== ''))
        }
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setCategories(DEFAULT_CATEGORIES)
          setError(err.message || null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchCategories()
    return () => { cancelled = true }
  }, [])

  return { categories, loading, error }
}
