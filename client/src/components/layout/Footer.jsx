import { Link } from 'react-router-dom'

function Footer({ className = '' }) {
  return (
    <footer
      className={`bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto hidden md:block ${className}`}
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-row items-center justify-between gap-4 min-h-[2.5rem]">
          {/* Left: copyright */}
          <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0 leading-none">
            © {new Date().getFullYear()} Kaam247
          </span>
          {/* Right: links + tagline — same text size and line height for alignment */}
          <div className="flex flex-row items-center justify-end gap-4 shrink-0 text-sm text-gray-500 dark:text-gray-400 leading-none">
            <Link
              to="/terms"
              className="hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded px-0.5 -mx-0.5 py-0.5"
            >
              Terms
            </Link>
            <span className="text-gray-400 dark:text-gray-500 select-none" aria-hidden="true">
              ·
            </span>
            <Link
              to="/privacy"
              className="hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded px-0.5 -mx-0.5 py-0.5"
            >
              Privacy
            </Link>
            <span className="text-gray-400 dark:text-gray-500 select-none" aria-hidden="true">
              ·
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              Made for local, real-world tasks
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
