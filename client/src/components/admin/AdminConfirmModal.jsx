import { useState } from 'react'

function AdminConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', confirmColor = 'blue', requireType = null, loading = false }) {
  const [typedText, setTypedText] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (requireType && typedText !== requireType) {
      return
    }
    onConfirm()
  }

  const canConfirm = !requireType || typedText === requireType

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 max-w-md w-full p-6" style={{ zIndex: 2001 }}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        
        {requireType && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type <span className="font-bold text-red-600 dark:text-red-400">{requireType}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder={requireType}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={`flex-1 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] ${
              confirmColor === 'red' ? 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600' :
              confirmColor === 'orange' ? 'bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600' :
              'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminConfirmModal

