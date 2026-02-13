import { Link } from 'react-router-dom'
import Footer from './Footer'
import ThemeToggle from '../ThemeToggle'

function PublicLayout({ children }) {

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/50 sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Brand Name */}
            <Link to="/" className="flex items-center h-full gap-2 sm:gap-2.5">
              <img
                src="/logo.svg"
                alt="Kaam247"
                className="h-8 sm:h-10 max-h-12 w-auto object-contain"
              />
              <span className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                Kaam247
              </span>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>

      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default PublicLayout

