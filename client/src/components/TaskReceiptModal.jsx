import React from 'react'
import { useCloseTransition } from '../hooks/useCloseTransition'

function TaskReceiptModal({ isOpen, onClose, task, taskId }) {
  const { isExiting, requestClose } = useCloseTransition(onClose, 220)

  if (!isOpen || !task) return null

  const completedAt = task.completedAt ? new Date(task.completedAt) : null
  const startedAt = task.startedAt ? new Date(task.startedAt) : null
  const postedTime = task.postedTime || null

  const handlePrint = () => {
    if (typeof window === 'undefined') return
    const printWindow = window.open('', '_blank', 'width=900,height=1000')
    if (!printWindow) return

    const createdAtText = postedTime || '—'
    const startedAtText = startedAt
      ? startedAt.toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Not recorded'
    const completedAtText = completedAt
      ? completedAt.toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Not recorded'

    const amountText = task.budget || `₹${task.budgetNum ?? 0}`
    const locationText = task.fullAddress || task.location || 'Location not specified'
    const cityText = task.city || ''

    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Kaam247 – Task receipt</title>
    <style>
      @page {
        margin: 15mm;
      }
      body {
        margin: 0;
        padding: 24px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f3f4f6;
        color: #111827;
      }
      .page {
        max-width: 720px;
        margin: 24px auto;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        padding: 24px 28px;
        box-sizing: border-box;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
      }
      h1 {
        font-size: 20px;
        margin: 0;
        font-weight: 700;
        color: #111827;
      }
      .subtitle {
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
      }
      .section {
        margin-top: 18px;
        padding-top: 12px;
        border-top: 1px dashed #e5e7eb;
      }
      .label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6b7280;
        margin-bottom: 4px;
        font-weight: 600;
      }
      .value {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        font-size: 12px;
        color: #111827;
      }
      .grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 32px;
      }
      .col {
        flex: 1 1 200px;
      }
      .footer {
        margin-top: 20px;
        font-size: 11px;
        color: #6b7280;
        line-height: 1.4;
      }
      @media print {
        body {
          background: #ffffff;
          padding: 0;
        }
        .page {
          border: 1px solid #d1d5db;
          box-shadow: none;
          border-radius: 12px;
          margin: 0 auto;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;">
        <div>
          <h1>Task receipt / summary</h1>
          <div class="subtitle">For reimbursement or record keeping</div>
        </div>
        <div style="text-align:right;">
          <div class="label">Status</div>
          <div class="value" style="color:#059669;">Completed</div>
        </div>
      </div>

      <div class="section">
        <div class="label">Task ID</div>
        <div class="mono">${taskId}</div>
      </div>

      <div class="section">
        <div class="label">Task</div>
        <div class="value">${task.title || ''}</div>
        ${task.description ? `<div style="margin-top:4px;font-size:13px;color:#374151;white-space:pre-line;">${task.description}</div>` : ''}
      </div>

      <div class="section grid">
        <div class="col">
          <div class="label">Category</div>
          <div class="value">${task.category || 'Not specified'}</div>
        </div>
        <div class="col">
          <div class="label">Amount (agreed budget)</div>
          <div class="value">${amountText}</div>
        </div>
      </div>

      <div class="section">
        <div class="label">Location</div>
        <div class="value">${locationText}</div>
        ${cityText ? `<div style="font-size:13px;color:#4b5563;margin-top:2px;">${cityText}</div>` : ''}
      </div>

      <div class="section grid">
        <div class="col">
          <div class="label">Posted by</div>
          <div class="value">${task.postedByName || 'Poster'}</div>
        </div>
        <div class="col">
          <div class="label">Assigned worker</div>
          <div class="value">${task.worker || 'Worker'}</div>
        </div>
      </div>

      <div class="section grid">
        <div class="col">
          <div class="label">Created at</div>
          <div class="value" style="font-size:13px;font-weight:500;">${createdAtText}</div>
        </div>
        <div class="col">
          <div class="label">Started at</div>
          <div class="value" style="font-size:13px;font-weight:500;">${startedAtText}</div>
        </div>
        <div class="col">
          <div class="label">Completed at</div>
          <div class="value" style="font-size:13px;font-weight:500;">${completedAtText}</div>
        </div>
      </div>

      <div class="footer">
        Generated by Kaam247. This receipt is for information and reimbursement purposes only.
        Payment is handled directly between poster and worker based on the agreed budget.
      </div>
    </div>
    <script>
      window.onload = function () {
        window.print();
      };
    </script>
  </body>
</html>`

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const paddingX = 'px-4 sm:px-6'
  const paddingY = 'py-4 sm:py-5'

  return (
    <div
      className={`fixed inset-0 z-[2100] bg-black/50 dark:bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 print:static print:bg-white print:p-0 print:block ${isExiting ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`}
      onClick={requestClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col border-0 sm:border border-gray-200 dark:border-gray-700 print:shadow-none print:rounded-none print:max-w-none print:w-full print:max-h-none print:border print:border-gray-300 ${isExiting ? 'animate-modal-sheet-out sm:animate-modal-panel-out' : 'animate-modal-sheet-in sm:animate-modal-panel-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-start justify-between gap-3 shrink-0 ${paddingX} ${paddingY} border-b border-gray-200 dark:border-gray-700`}>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
              Task receipt / summary
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              For reimbursement or record keeping
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="shrink-0 p-2 -m-2 touch-manipulation text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 print:hidden"
            aria-label="Close"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable body - same horizontal padding as header, no side gaps */}
        <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 bg-gray-50/80 dark:bg-gray-800/40">
          <div className={`${paddingX} ${paddingY} space-y-4 text-sm text-gray-800 dark:text-gray-100 print:bg-white`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-dashed border-gray-300 dark:border-gray-600 pb-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Task ID
              </p>
              <p className="font-mono text-xs text-gray-900 dark:text-gray-100 break-all mt-0.5">
                {taskId}
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Status
              </p>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">
                Completed
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
              Task
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100 break-words">
              {task.title}
            </p>
            {task.description && (
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-words">
                {task.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Category
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{task.category || 'Not specified'}</p>
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
            <p className="font-medium text-gray-900 dark:text-gray-100 break-words">
              {task.fullAddress || task.location || 'Location not specified'}
            </p>
            {task.city && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{task.city}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Posted by
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {task.postedByName || 'Poster'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Assigned worker
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {task.worker || 'Worker'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Created at
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
                {postedTime || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                Started at
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
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
              <p className="text-sm text-gray-900 dark:text-gray-100 break-words">
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

          <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              This summary is generated by Kaam247 for reimbursement or personal records.
              Payment is handled directly between poster and worker based on the agreed budget.
            </p>
          </div>
        </div>
        </div>

        <div
          className={`shrink-0 ${paddingX} pt-6 pb-4 sm:pb-6 flex flex-col sm:flex-row gap-3 print:hidden border-t border-gray-200 dark:border-gray-700`}
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <button
            type="button"
            onClick={requestClose}
            className="w-full sm:flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium touch-manipulation min-h-[44px]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium touch-manipulation min-h-[44px]"
          >
            Print / Save as PDF
          </button>
        </div>

        <div className={`${paddingX} pb-4 hidden print:block`}>
          <p className="text-[11px] text-gray-500">
            Generated by Kaam247 • This receipt is for information and reimbursement purposes only. Payment is handled directly between poster and worker.
          </p>
        </div>
      </div>
    </div>
  )
}

export default TaskReceiptModal

