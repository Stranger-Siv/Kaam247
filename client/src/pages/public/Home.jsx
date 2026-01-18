import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Home() {
    const { isAuthenticated } = useAuth()

    const categories = [
        { name: 'Cleaning', icon: '🧹' },
        { name: 'Delivery', icon: '📦' },
        { name: 'Helper / Labour', icon: '👷' },
        { name: 'Tutor', icon: '📚' },
        { name: 'Tech Help', icon: '💻' },
        { name: 'Errands', icon: '🏃' },
        { name: 'Event Help', icon: '🎉' },
        { name: 'Custom Task', icon: '✨' },
    ]

    return (
        <div className="bg-white">
            {/* HERO SECTION */}
            <section className="bg-white py-12 sm:py-16 lg:py-20 px-2 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
                        Get local help for everyday tasks — fast.
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto">
                        Post a task or earn by helping nearby people. No agencies. No delays.
                    </p>

                    {/* Primary CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                        <Link
                            to={isAuthenticated ? "/post-task" : "/login"}
                            className="px-8 sm:px-10 py-3.5 sm:py-4 bg-blue-600 text-white text-base sm:text-lg font-semibold rounded-lg shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200 active:scale-[0.98] min-h-[48px] flex items-center justify-center"
                        >
                            Post a Task
                        </Link>
                        <Link
                            to={isAuthenticated ? "/tasks" : "/login"}
                            className="px-8 sm:px-10 py-3.5 sm:py-4 bg-white text-gray-700 text-base sm:text-lg font-semibold rounded-lg border-2 border-gray-300 shadow-sm hover:bg-gray-50 hover:shadow-md hover:border-gray-400 transition-all duration-200 active:scale-[0.98] min-h-[48px] flex items-center justify-center"
                        >
                            Find Work Nearby
                        </Link>
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section className="bg-gray-50 py-12 sm:py-16 px-2 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
                        {categories.map((category) => (
                            <div
                                key={category.name}
                                className="bg-white rounded-xl p-5 sm:p-6 border border-gray-200 text-center"
                            >
                                <span className="text-3xl sm:text-4xl mb-2 block">{category.icon}</span>
                                <span className="text-sm sm:text-base font-medium text-gray-700">
                                    {category.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="bg-white py-12 sm:py-16 px-2 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8 sm:mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                            How Kaam247 Works
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600">
                            Real people. Real tasks. Nearby help — in minutes.
                        </p>
                    </div>

                    <div className="space-y-10 sm:space-y-12">
                        {/* Task Poster Section */}
                        <div className="bg-gray-50 rounded-xl p-6 sm:p-8 border border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl sm:text-3xl">👤</span>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    If you need help (Task Poster)
                                </h3>
                            </div>
                            <div className="space-y-5 sm:space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold text-sm">1</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">Post what you need done</h4>
                                        <p className="text-sm sm:text-base text-gray-600">
                                            Describe the task, set your budget, choose location and time.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold text-sm">2</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">Nearby helpers get notified</h4>
                                        <p className="text-sm sm:text-base text-gray-600">
                                            Only people close to you see the task — no agencies, no spam.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold text-sm">3</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">Get the work done</h4>
                                        <p className="text-sm sm:text-base text-gray-600">
                                            Connect directly, complete the task, and mark it done.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Worker Section */}
                        <div className="bg-gray-50 rounded-xl p-6 sm:p-8 border border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-2xl sm:text-3xl">🧑‍🔧</span>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    If you want to earn (Worker)
                                </h3>
                            </div>
                            <div className="space-y-5 sm:space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-semibold text-sm">1</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">Go online when you're available</h4>
                                        <p className="text-sm sm:text-base text-gray-600">
                                            Turn on availability to receive nearby task alerts.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-semibold text-sm">2</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">Accept tasks you want to do</h4>
                                        <p className="text-sm sm:text-base text-gray-600">
                                            Choose tasks that match your skills, time, and distance.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-semibold text-sm">3</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 mb-1">Complete & get rated</h4>
                                        <p className="text-sm sm:text-base text-gray-600">
                                            Finish the task, build your profile, and get more work.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Points */}
                    <div className="mt-10 sm:mt-12 pt-8 sm:pt-10 border-t border-gray-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-lg sm:text-xl">✔</span>
                                <p className="text-xs sm:text-sm font-medium text-gray-700">Verified users</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-lg sm:text-xl">✔</span>
                                <p className="text-xs sm:text-sm font-medium text-gray-700">Direct contact</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-lg sm:text-xl">✔</span>
                                <p className="text-xs sm:text-sm font-medium text-gray-700">Hyperlocal matching</p>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-lg sm:text-xl">✔</span>
                                <p className="text-xs sm:text-sm font-medium text-gray-700">Safe & reliable</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}

export default Home
