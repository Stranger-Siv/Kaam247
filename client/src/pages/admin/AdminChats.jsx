import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'

function AdminChats() {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [taskIdFilter, setTaskIdFilter] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [chatDetail, setChatDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    if (filterOpen) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [filterOpen])

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const params = new URLSearchParams()
      if (taskIdFilter.trim()) params.append('taskId', taskIdFilter.trim())
      if (userIdFilter.trim()) params.append('userId', userIdFilter.trim())
      const url = `${API_BASE_URL}/api/admin/chats${params.toString() ? `?${params}` : ''}`
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch chats')
      const data = await response.json()
      setChats(data.chats || [])
    } catch (err) {
      setError(err.message || 'Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  const openChatDetail = async (taskId) => {
    setSelectedTaskId(taskId)
    setChatDetail(null)
    setDetailLoading(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/chats/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load chat')
      const data = await response.json()
      setChatDetail(data.chat)
    } catch (err) {
      setChatDetail({ error: err.message })
    } finally {
      setDetailLoading(false)
    }
  }

  const closeChatDetail = () => {
    setSelectedTaskId(null)
    setChatDetail(null)
  }

  const messageCount = (c) => (c.messages && Array.isArray(c.messages) ? c.messages.length : 0)
  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—')

  if (loading && chats.length === 0) {
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
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
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
          Chat monitoring
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words">
          List chat rooms by task; view messages for moderation.
        </p>
      </div>

      {/* Filter icon + dropdown */}
      <div
        className="mb-5 sm:mb-6 lg:mb-8 relative inline-block w-full max-w-xs sm:max-w-sm md:w-auto"
        ref={filterRef}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setFilterOpen((o) => !o) }}
          className={`flex items-center justify-between md:justify-start gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors w-full md:w-auto ${taskIdFilter.trim() || userIdFilter.trim()
              ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          aria-label="Filters"
          aria-expanded={filterOpen}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
          {(taskIdFilter.trim() || userIdFilter.trim()) && (
            <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" aria-hidden />
          )}
        </button>
        {filterOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 w-full sm:w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg py-4 px-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Task ID</label>
                <input
                  type="text"
                  value={taskIdFilter}
                  onChange={(e) => setTaskIdFilter(e.target.value)}
                  placeholder="Filter by task ID"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">User ID (participant)</label>
                <input
                  type="text"
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                  placeholder="Filter by user ID"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => { fetchChats(); setFilterOpen(false) }}
                className="w-full px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600"
              >
                Apply filters
              </button>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-12 sm:py-16 lg:py-20">
          <p className="text-sm sm:text-base text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-12 sm:p-16 lg:p-20 text-center">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">No chats found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map((c) => (
            <div
              key={c._id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Task</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {c.taskId?.title ?? c.taskId ?? '—'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Status: {c.taskId?.status ?? '—'} · Task ID: {c.taskId?._id ?? c.taskId ?? '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {messageCount(c)} message{messageCount(c) !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => openChatDetail(String(c.taskId?._id ?? c.taskId))}
                    className="px-4 py-2 rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    View messages
                  </button>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Participants</p>
                <div className="flex flex-wrap gap-2">
                  {(c.participants || []).map((p) => (
                    <span key={p._id} className="text-sm text-gray-700 dark:text-gray-300">
                      {p.name} ({p.email || p.phone || p._id})
                    </span>
                  ))}
                  {(!c.participants || c.participants.length === 0) && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">—</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Chat messages */}
      {selectedTaskId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeChatDetail}
          role="dialog"
          aria-modal="true"
          aria-label="Chat messages"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Chat · Task {selectedTaskId}</h2>
              <button
                type="button"
                onClick={closeChatDetail}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400" />
                </div>
              ) : chatDetail?.error ? (
                <p className="text-sm text-red-600 dark:text-red-400">{chatDetail.error}</p>
              ) : chatDetail?.messages?.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No messages yet.</p>
              ) : (
                <ul className="space-y-3">
                  {(chatDetail?.messages || []).map((m, idx) => (
                    <li
                      key={m._id || idx}
                      className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {m.sender?.name ?? m.senderId ?? 'Unknown'}
                        </span>
                        <span>{formatDate(m.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 break-words">{m.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminChats
