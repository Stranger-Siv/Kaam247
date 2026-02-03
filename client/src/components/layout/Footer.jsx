import { Link } from 'react-router-dom'

function Footer({ className = '' }) {
  return (
    <footer
      className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto hidden md:block ${className}`}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-5 sm:py-4">
          {/* Left: copyright */}
          <p className="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
            © {new Date().getFullYear()} Kaam247
          </p>
          {/* Right: links + tagline */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 order-1 sm:order-2">
            <Link
              to="/terms"
              className="hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded px-0.5 -mx-0.5"
            >
              Terms
            </Link>
            <span className="text-gray-400 dark:text-gray-500 select-none" aria-hidden="true">
              ·
            </span>
            <Link
              to="/privacy"
              className="hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded px-0.5 -mx-0.5"
            >
              Privacy
            </Link>
            <span className="text-gray-400 dark:text-gray-500 select-none hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span className="hidden sm:inline text-gray-500 dark:text-gray-400">
              Made for local, real-world tasks
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
