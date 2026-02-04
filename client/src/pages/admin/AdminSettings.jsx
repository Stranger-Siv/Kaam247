import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/env'

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

function AdminSettings() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [adding, setAdding] = useState(false)
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [savingCategories, setSavingCategories] = useState(false)
  const [categoriesError, setCategoriesError] = useState(null)
  const commissionSetting = list.find((i) => i.key === 'platformCommissionPercent')

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    const item = list.find((i) => i.key === 'taskCategories')
    const arr = Array.isArray(item?.value) && item.value.length > 0 ? item.value : DEFAULT_CATEGORIES
    setCategories(arr.map((c) => String(c).trim()).filter(Boolean))
  }, [list])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      setList(data.list || [])
    } catch (err) {
      setError(err.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (item) => {
    setEditingKey(item.key)
    setEditValue(typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value ?? ''))
    setEditDescription(String(item.description ?? ''))
    setSaveError(null)
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditValue('')
    setEditDescription('')
    setSaveError(null)
  }

  const saveEdit = async () => {
    if (!editingKey) return
    setSaving(true)
    setSaveError(null)
    try {
      const token = localStorage.getItem('kaam247_token')
      let value = editValue.trim()
      if (value === '') value = null
      else if (/^-?\d+$/.test(value)) value = parseInt(value, 10)
      else if (value === 'true') value = true
      else if (value === 'false') value = false
      else if (value.startsWith('{') || value.startsWith('[')) {
        try { value = JSON.parse(value) } catch (_) { /* keep string */ }
      }
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          key: editingKey,
          value,
          description: editDescription.trim() || undefined
        })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to update')
      }
      await fetchSettings()
      cancelEdit()
    } catch (err) {
      setSaveError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addCategory = () => {
    const name = newCategory.trim()
    if (!name) return
    if (categories.some((c) => c.toLowerCase() === name.toLowerCase())) return
    setCategories((prev) => [...prev, name])
    setNewCategory('')
    setCategoriesError(null)
  }

  const removeCategory = (index) => {
    setCategories((prev) => prev.filter((_, i) => i !== index))
    setCategoriesError(null)
  }

  const saveCategories = async () => {
    setSavingCategories(true)
    setCategoriesError(null)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          key: 'taskCategories',
          value: categories,
          description: 'Task categories for posting and filtering'
        })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save categories')
      }
      await fetchSettings()
    } catch (err) {
      setCategoriesError(err.message || 'Failed to save categories')
    } finally {
      setSavingCategories(false)
    }
  }

  const addNew = async () => {
    const key = newKey.trim()
    if (!key) return
    setAdding(true)
    setSaveError(null)
    try {
      const token = localStorage.getItem('kaam247_token')
      let value = newValue.trim()
      if (value === '') value = null
      else if (/^-?\d+$/.test(value)) value = parseInt(value, 10)
      else if (value === 'true') value = true
      else if (value === 'false') value = false
      else if (value.startsWith('{') || value.startsWith('[')) {
        try { value = JSON.parse(value) } catch (_) { /* keep string */ }
      }
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          key,
          value,
          description: newDescription.trim() || undefined
        })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to add')
      }
      await fetchSettings()
      setNewKey('')
      setNewValue('')
      setNewDescription('')
    } catch (err) {
      setSaveError(err.message || 'Failed to add')
    } finally {
      setAdding(false)
    }
  }

  const displayValue = (v) => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }

  if (loading && list.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight break-words">
          System settings
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words">
          Platform config (commission %, limits, etc.). Values are stored by key.
        </p>
      </div>

      {/* Platform commission quick setting */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Platform commission</h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
          Percentage fee applied on each task&apos;s budget. Workers see this as platform commission on their earnings.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
            Commission %
            <input
              type="number"
              min={0}
              max={50}
              step={0.5}
              defaultValue={typeof commissionSetting?.value === 'number' ? commissionSetting.value : 0}
              onBlur={async (e) => {
                const raw = e.target.value
                const pct = raw === '' ? 0 : Math.max(0, Math.min(50, Number(raw) || 0))
                e.target.value = pct
                try {
                  const token = localStorage.getItem('kaam247_token')
                  await fetch(`${API_BASE_URL}/api/admin/settings`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                      key: 'platformCommissionPercent',
                      value: pct,
                      description: 'Platform commission percentage applied on task budgets'
                    })
                  })
                  fetchSettings()
                } catch {
                  // ignore, generic table below still allows manual fix
                }
              }}
              className="w-20 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            Current: <span className="font-semibold text-gray-900 dark:text-gray-100">{typeof commissionSetting?.value === 'number' ? commissionSetting.value : 0}%</span>
          </span>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {saveError}
        </div>
      )}

      {/* Task categories */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Task categories</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Categories shown when posting a task and in filters. Add or remove below, then click Save.
        </p>
        {categoriesError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
            {categoriesError}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat, index) => (
            <span
              key={`${cat}-${index}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium"
            >
              {cat}
              <button
                type="button"
                onClick={() => removeCategory(index)}
                className="p-0.5 rounded text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                aria-label={`Remove ${cat}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            placeholder="New category name"
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 w-48 min-w-0"
          />
          <button
            type="button"
            onClick={addCategory}
            disabled={!newCategory.trim()}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add category
          </button>
          <button
            type="button"
            onClick={saveCategories}
            disabled={savingCategories}
            className="px-4 py-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingCategories ? 'Saving…' : 'Save categories'}
          </button>
        </div>
      </div>

      {/* Add new */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">Add or update setting</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Key</label>
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="e.g. platformCommissionPercent"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Value</label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="e.g. 10 or true"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description (optional)</label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={addNew}
            disabled={adding || !newKey.trim()}
            className="px-4 py-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {adding ? 'Saving…' : 'Add / Update'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">No settings yet. Add one above.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Key</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Value</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Description</th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {list.map((item) => (
                  <tr key={item.key} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {item.key}
                    </td>
                    {editingKey === item.key ? (
                      <>
                        <td className="px-5 py-4">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full max-w-xs px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="text"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Description"
                            className="w-full max-w-xs px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={saving}
                            className="mr-2 px-3 py-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                          >
                            {saving ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300 break-all max-w-xs">
                          {displayValue(item.value)}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                          {item.description || '—'}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminSettings
