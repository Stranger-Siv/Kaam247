import LoginCTA from './LoginCTA'

/**
 * Consistent full-page view for unauthenticated users.
 * Use on Dashboard, Profile, Activity, Earnings, Transactions, Support, Settings.
 */
function GuestView({ title, description, message, returnUrl }) {
  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h1>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
        {description}
      </p>
      <LoginCTA message={message} returnUrl={returnUrl} />
    </div>
  )
}

export default GuestView
