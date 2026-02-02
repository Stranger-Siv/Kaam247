/**
 * Skeleton placeholder for a task card. Used while loading on Tasks page and Dashboard.
 */
function TaskCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 lg:p-7 shadow-sm dark:shadow-gray-900/50 border-2 border-gray-200 dark:border-gray-700 animate-pulse">
      <div className="flex items-start justify-between mb-4 sm:mb-5 gap-2">
        <div className="h-5 sm:h-6 bg-gray-200 dark:bg-gray-600 rounded-lg flex-1 max-w-[75%]" />
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex-shrink-0" />
      </div>
      <div className="space-y-2 mb-4 sm:mb-5">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-4/5" />
      </div>
      <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-600 rounded flex-shrink-0" />
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded flex-1 max-w-[180px]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-8 bg-gray-200 dark:bg-gray-600 rounded" />
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-600 rounded" />
        </div>
      </div>
      <div className="pt-4 sm:pt-5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-600 rounded-lg" />
        <div className="h-5 w-5 bg-gray-200 dark:bg-gray-600 rounded" />
      </div>
    </div>
  )
}

export default TaskCardSkeleton
