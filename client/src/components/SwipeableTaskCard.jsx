import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'

function SwipeableTaskCard({ task, onTaskAccepted, onTaskRemoved, isSaved, onToggleBookmark }) {
  return (
    <div className="relative overflow-hidden">
      <Link
        to={`/tasks/${task.id}`}
        className={`group bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 lg:p-7 shadow-sm dark:shadow-gray-900/50 hover:shadow-lg transition-all duration-200 border-2 active:bg-gray-50 dark:active:bg-gray-700 w-full overflow-hidden block ${task.isNew
          ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/20'
          : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
          }`}
      >
        <div className="flex items-start justify-between mb-4 sm:mb-5 gap-2 sm:gap-3 w-full min-w-0">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 flex-1 pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 break-words min-w-0 leading-tight">
            {task.title}
          </h3>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onToggleBookmark && (
              <button
                type="button"
                onClick={(e) => onToggleBookmark(task.id, e)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                aria-label={isSaved ? 'Remove from bookmarks' : 'Bookmark task'}
                title={isSaved ? 'Remove from bookmarks' : 'Bookmark task'}
              >
                {isSaved ? (
                  <svg className="w-5 h-5 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                )}
              </button>
            )}
            <span className="inline-flex items-center px-2 sm:px-2.5 py-1 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg whitespace-nowrap">
              {task.category}
            </span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-5 line-clamp-2 leading-relaxed break-words w-full">
          {task.description}
        </p>
        <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-5 w-full">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 w-full">
            <svg className="h-4 w-4 text-gray-400 dark:text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {task.distance && task.distance !== 'Distance unavailable' && (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg whitespace-nowrap border border-blue-100 dark:border-blue-800">
                {task.distance}
              </span>
            )}
            <span className="break-words min-w-0">{task.location}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full">
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {task.budget}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              <svg className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{task.time}</span>
            </div>
          </div>
        </div>
        <div className="pt-4 sm:pt-5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between w-full">
          <StatusBadge status={task.status} />
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </div>
  )
}

export default SwipeableTaskCard
