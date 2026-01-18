import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-8">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img
                src="/logo.svg"
                alt="Kaam247"
                className="h-6 sm:h-7 w-auto object-contain"
              />
              <span className="text-base sm:text-lg font-medium text-gray-900 whitespace-nowrap">
                Kaam247
              </span>
            </Link>
            <p className="text-xs sm:text-sm text-gray-500 mb-2">
              Local people. Real work. Fast help.
            </p>
            <p className="text-xs text-gray-400">
              Hyperlocal task marketplace
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h3>
            <div className="flex flex-col space-y-2">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">For Users</h3>
            <div className="flex flex-col space-y-2">
              <Link
                to=""
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Post a Task
              </Link>
              <Link
                to=""
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Find Work
              </Link>
              <Link
                to=""
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Task Categories
              </Link>
              <Link
                to=""
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Safety & Trust
              </Link>
            </div>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Support & Legal</h3>
            <div className="flex flex-col space-y-2">
              <Link
                to=""
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Contact Us
              </Link>
              <Link
                to=""
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to=""
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to=""
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Help Center
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              © {new Date().getFullYear()} Kaam247. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center sm:justify-end gap-4 text-xs text-gray-500">
              <span>Made for local, real-world tasks</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
