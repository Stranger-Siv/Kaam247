import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../config/env'

/**
 * Task-based chat: one chat per task. Shown only when task is ACCEPTED or IN_PROGRESS (or read-only when COMPLETED).
 * - Fetches messages on open via REST
 * - Joins socket room for real-time receive_message
 * - Sends via REST + optimistic UI; socket broadcasts to other participant
 */
function TaskChat({ isOpen, onClose, taskId, taskTitle, isReadOnly, user, getSocket, otherLabel = 'Other' }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const socketRef = useRef(null)
  const receiveHandlerRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!isOpen || !taskId) return

    setLoading(true)
    setError(null)

    const token = localStorage.getItem('kaam247_token')
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/chat`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) {
          if (res.status === 403 || res.status === 404) {
            setError('Chat unavailable')
            setMessages([])
            return
          }
          throw new Error('Failed to load chat')
        }
        const data = await res.json()
        setMessages(data.messages || [])
        if (data.isReadOnly !== undefined) {
          // Parent may pass isReadOnly; API also returns it for COMPLETED
        }
      } catch (err) {
        setError('Chat unavailable')
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [isOpen, taskId])

  useEffect(() => {
    if (!isOpen || !taskId) return

    const socket = getSocket && getSocket()
    if (!socket || !socket.connected) {
      socketRef.current = null
      return
    }

    socketRef.current = socket
    socket.emit('join_task_chat', { taskId })

    const handleReceive = (payload) => {
      if (String(payload.taskId) !== String(taskId)) return
      const msg = payload.message
      if (!msg || !msg.text) return
      setMessages((prev) => {
        const exists = prev.some((m) => String(m._id) === String(msg._id))
        if (exists) return prev
        return [...prev, { _id: msg._id, senderId: msg.senderId, text: msg.text, createdAt: msg.createdAt }]
      })
    }

    receiveHandlerRef.current = handleReceive
    socket.on('receive_message', handleReceive)

    return () => {
      socket.off('receive_message', receiveHandlerRef.current)
      socket.emit('leave_task_chat', { taskId })
      socketRef.current = null
    }
  }, [isOpen, taskId, getSocket])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || sending || isReadOnly) return

    const token = localStorage.getItem('kaam247_token')
    const optimistic = {
      _id: 'opt-' + Date.now(),
      senderId: user?.id,
      text: trimmed,
      createdAt: new Date().toISOString()
    }
    setMessages((prev) => [...prev, optimistic])
    setInputText('')
    setSending(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text: trimmed })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        setMessages((prev) => prev.filter((m) => m._id !== optimistic._id))
        setInputText(trimmed)
        setError(errData.message || 'Failed to send')
        return
      }

      const data = await res.json()
      setMessages((prev) =>
        prev.map((m) => (m._id === optimistic._id ? { ...m, _id: data.data?._id || m._id, createdAt: data.data?.createdAt || m.createdAt } : m))
      )
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id))
      setInputText(trimmed)
      setError('Failed to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2500] bg-black/60 dark:bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl h-[85vh] sm:h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{taskTitle || 'Task Chat'}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Chat with {otherLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading chat...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-[320px] bg-gray-50/50 dark:bg-gray-900/30">
              {messages.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-base text-gray-600 dark:text-gray-400 font-medium">No messages yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Say hello to get the conversation started!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = user?.id && String(msg.senderId) === String(user.id)
                return (
                  <div
                    key={msg._id}
                    className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isMe && (
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {(otherLabel || 'O').charAt(0)}
                      </div>
                    )}
                    <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-1">
                        {isMe ? 'You' : otherLabel} · {formatTime(msg.createdAt)}
                      </span>
                      <div
                        className={`px-4 py-3 rounded-2xl text-base leading-snug break-words ${isMe
                            ? 'bg-blue-600 dark:bg-blue-500 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 rounded-bl-md shadow-sm'
                          }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                    {isMe && (
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-sm font-semibold text-white">
                        {(user?.name || 'Y').charAt(0)}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {isReadOnly ? (
              <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/80 text-center text-sm text-gray-600 dark:text-gray-400">
                Task completed. Chat is now read-only.
              </div>
            ) : (
              <form onSubmit={handleSend} className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={2000}
                    disabled={sending}
                    className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputText.trim()}
                    className="px-5 py-3 bg-blue-600 dark:bg-blue-500 text-white text-base font-medium rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? '…' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default TaskChat
