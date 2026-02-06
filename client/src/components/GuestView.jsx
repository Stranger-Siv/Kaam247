import LoginCTA from './LoginCTA'

/**
 * Consistent full-page view for unauthenticated users.
 * Use on Dashboard, Profile, Activity, Earnings, Transactions, Support, Settings.
 */
function GuestView({ title, description, message, returnUrl }) {
  return (
    <div className="guest-view-container max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">
      <h1 className="guest-view-title text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h1>
      <p className="guest-view-description text-gray-600 dark:text-gray-400 mb-6">
        {description}
      </p>
      <LoginCTA message={message} returnUrl={returnUrl} />
    </div>
  )
}

export default GuestView
