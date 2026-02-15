import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useCloseTransition } from '../hooks/useCloseTransition'

function ConfirmationModal({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmColor = 'red' }) {
  const { isExiting, requestClose } = useCloseTransition(onCancel, 200)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const confirmButtonClass = confirmColor === 'red' 
    ? 'bg-red-600 hover:bg-red-700' 
    : confirmColor === 'blue'
    ? 'bg-blue-600 hover:bg-blue-700'
    : 'bg-gray-600 hover:bg-gray-700'

  const confirmButtonClassDark = confirmColor === 'red' 
    ? 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600' 
    : confirmColor === 'blue'
    ? 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'
    : 'bg-gray-600 dark:bg-gray-500 hover:bg-gray-700 dark:hover:bg-gray-600'

  const handleCancel = () => requestClose()
  const handleConfirm = () => {
    onConfirm()
    requestClose()
  }

  const content = (
    <div className={`fixed inset-0 z-[2500] bg-black/60 dark:bg-black/80 flex items-center justify-center p-4 ${isExiting ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`} onClick={handleCancel}>
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 ${isExiting ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 px-4 py-2.5 ${confirmButtonClassDark} text-white rounded-lg transition-colors font-medium`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default ConfirmationModal

