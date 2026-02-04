import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'

function AdminTicketDetail() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const [ticket, setTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const CHAT_DRAFT_KEY = (id) => `admin_support_chat_draft_${id || ''}`
  const RESOLVE_DRAFT_KEY = (id) => `admin_support_resolve_${id || ''}`
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolveNotes, setResolveNotes] = useState('')
  const messagesEndRef = useRef(null)
  const receiveHandlerRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchTicket = async () => {
    if (!ticketId) return
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const res = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Failed to load ticket')
        setTicket(null)
        setMessages([])
        return
      }
      const t = data.ticket
      setTicket(t)
      const list = []
      if (t.type === 'SUPPORT' && t.initialMessage) {
        list.push({
          _id: 'initial',
          senderId: t.user?._id || t.user,
          text: t.initialMessage,
          createdAt: t.createdAt
        })
      }
      if (Array.isArray(t.messages)) {
        list.push(...t.messages.map((m) => ({
          _id: m._id,
          senderId: m.senderId?.toString?.() || m.senderId,
          text: m.text,
          createdAt: m.createdAt
        })))
      }
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      setMessages(list)
    } catch (err) {
      setError(err.message || 'Failed to load ticket')
      setTicket(null)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  // Restore chat + resolve drafts after refresh or ticketId change
  useEffect(() => {
    if (!ticketId) return
    try {
      const chatSaved = sessionStorage.getItem(CHAT_DRAFT_KEY(ticketId))
      if (chatSaved != null && chatSaved !== '') setInputText(chatSaved)
      const notesSaved = sessionStorage.getItem(RESOLVE_DRAFT_KEY(ticketId))
      if (notesSaved != null && notesSaved !== '') setResolveNotes(notesSaved)
    } catch (_) { /* ignore */ }
  }, [ticketId])

  // Persist drafts so they survive refresh
  useEffect(() => {
    if (!ticketId) return
    try {
      if (inputText) sessionStorage.setItem(CHAT_DRAFT_KEY(ticketId), inputText)
      else sessionStorage.removeItem(CHAT_DRAFT_KEY(ticketId))
      if (resolveNotes) sessionStorage.setItem(RESOLVE_DRAFT_KEY(ticketId), resolveNotes)
      else sessionStorage.removeItem(RESOLVE_DRAFT_KEY(ticketId))
    } catch (_) { /* ignore */ }
  }, [ticketId, inputText, resolveNotes])

  useEffect(() => {
    if (!ticketId || !ticket) return
    const socket = getSocket && getSocket()
    if (!socket || !socket.connected) return

    socket.emit('join_ticket_chat', { ticketId })

    const handleReceive = (payload) => {
      if (String(payload.ticketId) !== String(ticketId)) return
      const msg = payload.message
      if (!msg || !msg.text) return
      if (user?.id && String(msg.senderId) === String(user.id)) return
      setMessages((prev) => {
        const exists = prev.some((m) => String(m._id) === String(msg._id))
        if (exists) return prev
        return [...prev, { _id: msg._id, senderId: msg.senderId, text: msg.text, createdAt: msg.createdAt }]
      })
    }

    receiveHandlerRef.current = handleReceive
    socket.on('ticket_message', handleReceive)

    return () => {
      socket.off('ticket_message', receiveHandlerRef.current)
      socket.emit('leave_ticket_chat', { ticketId })
    }
  }, [ticketId, ticket, getSocket, user?.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleAccept = async () => {
    if (!ticketId || ticket?.status !== 'OPEN') return
    setAccepting(true)
    setError(null)
    try {
      const token = localStorage.getItem('kaam247_token')
      const res = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticketId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to accept')
      await fetchTicket()
    } catch (err) {
      setError(err.message || 'Failed to accept ticket')
    } finally {
      setAccepting(false)
    }
  }

  const handleResolve = async (status = 'RESOLVED') => {
    if (!ticketId) return
    setResolving(true)
    setError(null)
    try {
      const token = localStorage.getItem('kaam247_token')
      const res = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, adminNotes: resolveNotes.trim() })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to resolve')
      await fetchTicket()
      setResolveNotes('')
      try { sessionStorage.removeItem(RESOLVE_DRAFT_KEY(ticketId)) } catch (_) { /* ignore */ }
    } catch (err) {
      setError(err.message || 'Failed to resolve ticket')
    } finally {
      setResolving(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    const trimmed = inputText.trim()
    if (!trimmed || sending || ticket?.status !== 'ACCEPTED') return

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
      const res = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
        prev.map((m) =>
          m._id === optimistic._id
            ? { ...m, _id: data.data?._id || m._id, createdAt: data.data?.createdAt || m.createdAt }
            : m
        )
      )
      try { sessionStorage.removeItem(CHAT_DRAFT_KEY(ticketId)) } catch (_) { /* ignore */ }
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
    return new Date(dateStr).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isOwn = (senderId) => user?.id && String(senderId) === String(user.id)

  if (loading) {
    return (
      <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className="fixed inset-0 z-[1100] flex flex-col bg-gray-50 dark:bg-gray-950 p-4 pt-[env(safe-area-inset-top)]">
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/tickets')}
          className="text-blue-600 dark:text-blue-400 font-medium"
        >
          ← Back to Tickets
        </button>
      </div>
    )
  }

  const canChat = ticket?.type === 'SUPPORT' && ticket?.status === 'ACCEPTED'
  const canAccept = ticket?.type === 'SUPPORT' && ticket?.status === 'OPEN'
  const canResolve = ticket?.type === 'SUPPORT' && (ticket?.status === 'OPEN' || ticket?.status === 'ACCEPTED')

  return (
    <div
      className="fixed inset-0 z-[1100] flex flex-col bg-gray-50 dark:bg-gray-950"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      {/* Header - 56px */}
      <header className="flex-shrink-0 h-14 px-4 flex flex-wrap items-center gap-2 sm:gap-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <button
          type="button"
          onClick={() => navigate('/admin/tickets')}
          className="p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 shrink-0"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">
            {ticket?.subject || 'Support ticket'}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {ticket?.user?.name}
            {ticket?.user?.email && ` · ${ticket.user.email}`}
          </p>
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${ticket?.status === 'OPEN' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' :
          ticket?.status === 'ACCEPTED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
            ticket?.status === 'RESOLVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
          {ticket?.status}
        </span>
        {canAccept && (
          <button
            type="button"
            onClick={handleAccept}
            disabled={accepting}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
          >
            {accepting ? 'Accepting…' : 'Accept & start chat'}
          </button>
        )}
      </header>

      {error && (
        <div className="flex-shrink-0 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border-b border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Messages - fills viewport, consistent padding */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-4 space-y-3 bg-white dark:bg-gray-900">
        {messages.map((m) => (
          <div
            key={m._id}
            className={`flex ${isOwn(m.senderId) ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${isOwn(m.senderId)
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
                }`}
            >
              {!isOwn(m.senderId) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">User</p>
              )}
              <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
              <p className={`text-xs mt-1 ${isOwn(m.senderId) ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {formatTime(m.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Resolve bar - above input when open */}
      {canResolve && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value.slice(0, 500))}
            placeholder="Admin notes (optional)"
            className="flex-1 min-w-[120px] h-9 px-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
            maxLength={500}
          />
          <button
            type="button"
            onClick={() => handleResolve('RESOLVED')}
            disabled={resolving}
            className="shrink-0 h-9 px-4 rounded-lg bg-green-600 dark:bg-green-500 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {resolving ? 'Closing…' : 'Resolve'}
          </button>
          <button
            type="button"
            onClick={() => handleResolve('REJECTED')}
            disabled={resolving}
            className="shrink-0 h-9 px-4 rounded-lg bg-gray-500 dark:bg-gray-600 text-white text-sm font-medium hover:bg-gray-600 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}

      {canChat && (
        <form
          onSubmit={handleSend}
          className="flex-shrink-0 px-4 pt-3 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value.slice(0, 2000))}
              placeholder="Reply to user…"
              className="flex-1 min-w-0 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="shrink-0 h-11 px-5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default AdminTicketDetail
