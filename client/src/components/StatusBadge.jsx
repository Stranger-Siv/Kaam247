// Shared status badge component for consistent status display
export const getStatusBadge = (status) => {
  const raw = status || ''
  const upper = typeof raw === 'string' ? raw.toUpperCase() : ''
  const lower = typeof raw === 'string' ? raw.toLowerCase() : ''

  // Normalize backend variants to stable UI statuses
  let normalizedStatus = lower || 'unknown'
  if (upper === 'OPEN' || upper === 'SEARCHING' || lower === 'open' || lower === 'searching') normalizedStatus = 'open'
  if (upper === 'ACCEPTED' || lower === 'accepted') normalizedStatus = 'accepted'
  if (upper === 'IN_PROGRESS' || lower === 'in_progress' || lower === 'in progress') normalizedStatus = 'in_progress'
  if (upper === 'COMPLETED' || lower === 'completed') normalizedStatus = 'completed'
  if (upper === 'CANCELLED' || upper.startsWith('CANCELLED_BY_') || lower === 'cancelled') normalizedStatus = 'cancelled'
  
  const badges = {
    open: { text: 'Open', className: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' },
    searching: { text: 'Searching', className: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' },
    accepted: { text: 'Accepted', className: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800' },
    in_progress: { text: 'In Progress', className: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800' },
    completed: { text: 'Completed', className: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' },
    cancelled: { text: 'Cancelled', className: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' },
    unknown: { text: 'Unknown', className: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700' }
  }
  
  return badges[normalizedStatus] || badges.unknown
}

export default function StatusBadge({ status, className = '' }) {
  const badge = getStatusBadge(status)
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badge.className} ${className}`}>
      {badge.text}
    </span>
  )
}

