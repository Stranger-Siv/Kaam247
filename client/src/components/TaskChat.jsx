import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../config/env'
import { useCloseTransition } from '../hooks/useCloseTransition'

/**
 * Task-based chat: one chat per task. Shown only when task is ACCEPTED or IN_PROGRESS (or read-only when COMPLETED).
 * - Fetches messages on open via REST
 * - Joins socket room for real-time receive_message
 * - Sends via REST + optimistic UI; socket broadcasts to other participant
 */
function TaskChat({ isOpen, onClose, taskId, taskTitle, isReadOnly, user, getSocket, otherLabel = 'Other', userMode = 'worker' }) {
  const { isExiting, requestClose } = useCloseTransition(onClose, 200)
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
      // Don't add our own message from socket – we already have it from optimistic update
      if (user?.id && String(msg.senderId) === String(user.id)) return
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
  }, [isOpen, taskId, getSocket, user?.id])

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
        setError(res.status === 429 ? 'Sending too fast. Please wait a moment.' : (errData.message || 'Failed to send'))
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

  const quickRepliesWorker = [
    'On my way',
    'Reached',
    'Running a bit late',
    'Done, please confirm',
    'Will complete in 10 mins',
    'Need a few more details'
  ]
  const quickRepliesPoster = [
    'Thanks!',
    'Let me know when you start',
    'Please confirm when you\'re done',
    'Any questions?',
    'I\'ve shared the address',
    'See you then'
  ]
  const quickReplies = userMode === 'poster' ? quickRepliesPoster : quickRepliesWorker

  const sendQuickReply = (text) => {
    setInputText(text)
    // Optionally send immediately: simulate submit
    if (!sending && !isReadOnly) {
      setInputText('')
      const token = localStorage.getItem('kaam247_token')
      const optimistic = {
        _id: 'opt-' + Date.now(),
        senderId: user?.id,
        text,
        createdAt: new Date().toISOString()
      }
      setMessages((prev) => [...prev, optimistic])
      setSending(true)
      fetch(`${API_BASE_URL}/api/tasks/${taskId}/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ text })
      })
        .then((res) => {
          if (!res.ok) {
            const is429 = res.status === 429
            return res.json().catch(() => ({})).then((d) => {
              throw new Error(is429 ? 'Sending too fast. Please wait a moment.' : (d.message || 'Failed to send'))
            })
          }
          return res.json()
        })
        .then((data) => {
          setMessages((prev) =>
            prev.map((m) => (m._id === optimistic._id ? { ...m, _id: data.data?._id || m._id, createdAt: data.data?.createdAt || m.createdAt } : m))
          )
        })
        .catch((err) => {
          setMessages((prev) => prev.filter((m) => m._id !== optimistic._id))
          setInputText(text)
          setError(err.message || 'Failed to send. Please try again.')
        })
        .finally(() => setSending(false))
    }
  }

  if (!isOpen) return null

  const { isExiting, requestClose } = useCloseTransition(onClose, 200)

  return (
    <div className={`fixed inset-0 z-[2500] bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 ${isExiting ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`} onClick={requestClose}>
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl h-[85vh] sm:h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 ${isExiting ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate pr-2">{taskTitle || 'Task Chat'}</h3>
          <button
            type="button"
            onClick={requestClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">Loading chat...</div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[280px] bg-gray-100 dark:bg-gray-900/50">
              {messages.length === 0 && !error && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No messages yet. Say hello!</p>
              )}
              {messages.map((msg) => {
                const isMe = user?.id && String(msg.senderId) === String(user.id)
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2.5 rounded-lg text-sm ${isMe
                        ? 'text-right bg-blue-600 dark:bg-blue-500 text-white'
                        : 'text-left bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                        }`}
                    >
                      <span className={`text-xs ${isMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                        {isMe ? 'You' : otherLabel} {formatTime(msg.createdAt)}
                      </span>
                      <p className={`mt-0.5 break-words whitespace-pre-wrap ${isMe ? 'text-white' : ''}`}>{msg.text}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {isReadOnly ? (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
                Task completed. Chat is now read-only.
              </div>
            ) : (
              <form onSubmit={handleSend} className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickReplies.map((text) => (
                    <button
                      key={text}
                      type="button"
                      disabled={sending}
                      onClick={() => sendQuickReply(text)}
                      className="px-2.5 py-1.5 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {text}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={2000}
                    disabled={sending}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={sending || !inputText.trim()}
                    className="px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
