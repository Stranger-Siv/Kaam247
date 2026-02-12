import React from 'react'

function TaskReceiptModal({ isOpen, onClose, task, taskId }) {
  if (!isOpen || !task) return null

  const completedAt = task.completedAt ? new Date(task.completedAt) : null
  const startedAt = task.startedAt ? new Date(task.startedAt) : null
  const postedTime = task.postedTime || null

  return (
    <div
      className="fixed inset-0 z-[2100] bg-black/50 dark:bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Task receipt / summary
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              For reimbursement or record keeping
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 text-sm sm:text-base text-gray-800 dark:text-gray-100">
          <div className="flex items-center justify-between border-b border-dashed border-gray-300 dark:border-gray-700 pb-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Task ID
              </p>
              <p className="font-mono text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                {taskId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Status
              </p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                Completed
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
              Task
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {task.title}
            </p>
            {task.description && (
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {task.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Category
              </p>
              <p className="font-medium">{task.category || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Amount (agreed budget)
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {task.budget || `₹${task.budgetNum ?? 0}`}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
              Location
            </p>
            <p className="font-medium">
              {task.fullAddress || task.location || 'Location not specified'}
            </p>
            {task.city && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{task.city}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Posted by
              </p>
              <p className="font-medium">
                {task.postedByName || 'Poster'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Assigned worker
              </p>
              <p className="font-medium">
                {task.worker || 'Worker'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Created at
              </p>
              <p className="text-sm">
                {postedTime || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Started at
              </p>
              <p className="text-sm">
                {startedAt
                  ? startedAt.toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Not recorded'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Completed at
              </p>
              <p className="text-sm">
                {completedAt
                  ? completedAt.toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Not recorded'}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-dashed border-gray-300 dark:border-gray-700 pt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This summary is generated by Kaam247 for reimbursement or personal records.
              Payment is handled directly between poster and worker based on the agreed budget.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskReceiptModal

