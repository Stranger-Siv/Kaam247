import { Link } from 'react-router-dom'

function Footer({ className = '' }) {
  return (
    <footer
      className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto hidden md:block ${className}`}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-row items-baseline justify-between gap-4 min-h-[2.5rem]">
          {/* Left: copyright */}
          <span className="text-sm leading-normal text-gray-500 dark:text-gray-400 shrink-0">
            © {new Date().getFullYear()} Kaam247
          </span>
          {/* Right: links + tagline — baseline-aligned, even spacing */}
          <div className="flex flex-row items-baseline justify-end gap-3 shrink-0 text-sm leading-normal text-gray-500 dark:text-gray-400">
            <Link
              to="/terms"
              className="inline hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
            >
              Terms
            </Link>
            <span className="text-gray-400 dark:text-gray-500 select-none" aria-hidden="true">
              ·
            </span>
            <Link
              to="/privacy"
              className="inline hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
            >
              Privacy
            </Link>
            <span className="text-gray-400 dark:text-gray-500 select-none" aria-hidden="true">
              ·
            </span>
            <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
              Made for local, real-world tasks
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
