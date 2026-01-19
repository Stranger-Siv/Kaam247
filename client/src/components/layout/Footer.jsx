function Footer({ className = '' }) {
  return (
    <footer className={`bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto hidden md:block ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-row justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} Kaam247
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Made for local, real-world tasks
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
