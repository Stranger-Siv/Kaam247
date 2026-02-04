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
      <div className="p-4 flex items-center justify-center min-h-[40vh]">
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className="p-4">
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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => navigate('/admin/tickets')}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
          {ticket?.subject || 'Support ticket'}
        </h1>
      </div>

      <div className="mb-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          User: <strong className="text-gray-900 dark:text-gray-100">{ticket?.user?.name}</strong> ({ticket?.user?.email})
          {ticket?.user?.phone && ` · ${ticket?.user?.phone}`}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Created {formatDate(ticket?.createdAt)}
          {ticket?.acceptedAt && ` · Accepted ${formatDate(ticket.acceptedAt)}`}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            ticket?.status === 'OPEN' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' :
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
              className="px-3 py-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {accepting ? 'Accepting…' : 'Accept & start chat'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 overflow-hidden flex flex-col" style={{ minHeight: '320px', maxHeight: '60vh' }}>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
          {messages.map((m) => (
            <div
              key={m._id}
              className={`flex ${isOwn(m.senderId) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  isOwn(m.senderId)
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

        {canChat && (
          <form onSubmit={handleSend} className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value.slice(0, 2000))}
                placeholder="Reply to user…"
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        )}
      </div>

      {canResolve && (
        <div className="mt-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Close ticket (optional notes)</label>
          <input
            type="text"
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value.slice(0, 500))}
            placeholder="Admin notes (optional)"
            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm mb-2 focus:ring-2 focus:ring-blue-500"
            maxLength={500}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleResolve('RESOLVED')}
              disabled={resolving}
              className="px-4 py-2 rounded-lg bg-green-600 dark:bg-green-500 text-white text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
            >
              {resolving ? 'Closing…' : 'Resolve & close'}
            </button>
            <button
              type="button"
              onClick={() => handleResolve('REJECTED')}
              disabled={resolving}
              className="px-4 py-2 rounded-lg bg-gray-500 dark:bg-gray-600 text-white text-sm font-medium hover:bg-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTicketDetail
