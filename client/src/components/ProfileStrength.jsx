import { Link } from 'react-router-dom'

function ProfileStrength({ userData, userMode, stats }) {
    if (!userData) return null

    // Calculate profile strength based on available fields
    const calculateStrength = () => {
        const checks = []
        let score = 0
        const maxScore = 8

        // 1. Name (required, always present)
        if (userData.name && userData.name.trim()) {
            checks.push({ label: 'Name', completed: true })
            score += 1
        } else {
            checks.push({ label: 'Name', completed: false, action: '/settings' })
        }

        // 2. Email
        if (userData.email && userData.email.trim()) {
            checks.push({ label: 'Email address', completed: true })
            score += 1
        } else {
            checks.push({ label: 'Email address', completed: false, note: 'Optional but recommended' })
        }

        // 3. Phone
        if (userData.phone && userData.phone.trim()) {
            checks.push({ label: 'Phone number', completed: true })
            score += 1
        } else {
            checks.push({ label: 'Phone number', completed: false, note: 'Optional but recommended' })
        }

        // 4. Phone verified
        if (userData.phoneVerified) {
            checks.push({ label: 'Phone verified', completed: true })
            score += 1
        } else if (userData.phone) {
            checks.push({ label: 'Phone verified', completed: false, note: 'Verify your phone number' })
        } else {
            checks.push({ label: 'Phone verified', completed: false, note: 'Add phone first' })
        }

        // 5. Profile photo
        if (userData.profilePhoto) {
            checks.push({ label: 'Profile photo', completed: true })
            score += 1
        } else {
            checks.push({ label: 'Profile photo', completed: false, action: '/settings', note: 'Add a photo' })
        }

        // 6. Location
        if (userData.location?.coordinates && userData.location?.area) {
            checks.push({ label: 'Location set', completed: true })
            score += 1
        } else {
            checks.push({ label: 'Location set', completed: false, action: '/settings', note: 'Set your location' })
        }

        // 7. Worker preferences (for workers only)
        if (userMode === 'worker') {
            if (userData.workerPreferences?.preferredCategories?.length > 0) {
                checks.push({ label: 'Preferred categories', completed: true })
                score += 1
            } else {
                checks.push({ label: 'Preferred categories', completed: false, action: '/settings', note: 'Set your preferences' })
            }
        } else {
            // For posters, check if they've posted at least one task
            if (stats?.tasksPosted > 0) {
                checks.push({ label: 'Posted at least one task', completed: true })
                score += 1
            } else {
                checks.push({ label: 'Posted at least one task', completed: false, action: '/post-task', note: 'Post your first task' })
            }
        }

        // 8. Activity (completed tasks)
        if (userMode === 'worker') {
            if (stats?.tasksCompleted > 0) {
                checks.push({ label: 'Completed at least one task', completed: true })
                score += 1
            } else {
                checks.push({ label: 'Completed at least one task', completed: false, action: '/tasks', note: 'Complete a task' })
            }
        } else {
            if (stats?.tasksCompleted > 0) {
                checks.push({ label: 'Completed at least one task', completed: true })
                score += 1
            } else {
                checks.push({ label: 'Completed at least one task', completed: false, note: 'Complete a task with a worker' })
            }
        }

        const percentage = Math.round((score / maxScore) * 100)
        return { percentage, score, maxScore, checks }
    }

    const { percentage, score, maxScore, checks } = calculateStrength()

    // Determine strength level and color
    const getStrengthLevel = () => {
        if (percentage >= 80) return { level: 'Strong', color: 'green', bgColor: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-700 dark:text-green-300', borderColor: 'border-green-200 dark:border-green-800' }
        if (percentage >= 60) return { level: 'Good', color: 'blue', bgColor: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-700 dark:text-blue-300', borderColor: 'border-blue-200 dark:border-blue-800' }
        if (percentage >= 40) return { level: 'Fair', color: 'yellow', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', textColor: 'text-yellow-700 dark:text-yellow-300', borderColor: 'border-yellow-200 dark:border-yellow-800' }
        return { level: 'Basic', color: 'gray', bgColor: 'bg-gray-50 dark:bg-gray-800', textColor: 'text-gray-700 dark:text-gray-300', borderColor: 'border-gray-200 dark:border-gray-700' }
    }

    const strengthInfo = getStrengthLevel()

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6 mb-4 sm:mb-6 ${strengthInfo.bgColor} ${strengthInfo.borderColor}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        Profile Strength
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        Complete your profile to get more opportunities
                    </p>
                </div>
                <div className="text-right">
                    <div className={`text-2xl sm:text-3xl font-bold ${strengthInfo.textColor}`}>
                        {percentage}%
                    </div>
                    <div className={`text-xs font-semibold ${strengthInfo.textColor} mt-0.5`}>
                        {strengthInfo.level}
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${strengthInfo.color === 'green' ? 'bg-green-500' :
                                strengthInfo.color === 'blue' ? 'bg-blue-500' :
                                    strengthInfo.color === 'yellow' ? 'bg-yellow-500' :
                                        'bg-gray-500'
                            }`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    {score} of {maxScore} items completed
                </p>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
                {checks.map((check, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm">
                        {check.completed ? (
                            <>
                                <svg className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-gray-700 dark:text-gray-300 flex-1">{check.label}</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                    {check.action ? (
                                        <Link
                                            to={check.action}
                                            className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors underline"
                                        >
                                            {check.label}
                                        </Link>
                                    ) : (
                                        <span className="text-gray-500 dark:text-gray-400">{check.label}</span>
                                    )}
                                    {check.note && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">({check.note})</span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ProfileStrength
