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
            <section className="bg-white py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-5 lg:mb-6 leading-tight tracking-tight">
                        Get local help for everyday tasks — fast.
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8 sm:mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed">
                        Post a task or earn by helping nearby people. No agencies. No delays.
                    </p>

                    {/* Primary CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center">
                        <Link
                            to={isAuthenticated ? "/post-task" : "/login"}
                            className="px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-4.5 bg-blue-600 text-white text-base sm:text-lg font-semibold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] flex items-center justify-center touch-manipulation"
                        >
                            Post a Task
                        </Link>
                        <Link
                            to={isAuthenticated ? "/tasks" : "/login"}
                            className="px-6 sm:px-8 lg:px-10 py-3.5 sm:py-4 lg:py-4.5 bg-white text-gray-700 text-base sm:text-lg font-semibold rounded-xl border-2 border-gray-300 shadow-sm hover:bg-gray-50 hover:shadow-md hover:border-gray-400 transition-all duration-200 active:scale-[0.98] min-h-[48px] sm:min-h-[52px] flex items-center justify-center touch-manipulation"
                        >
                            Find Work Nearby
                        </Link>
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section className="bg-gray-50 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                        {categories.map((category) => (
                            <div
                                key={category.name}
                                className="bg-white rounded-xl p-4 sm:p-5 lg:p-6 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-center group"
                            >
                                <span className="text-3xl sm:text-4xl lg:text-5xl mb-2 sm:mb-3 block group-hover:scale-110 transition-transform duration-200">{category.icon}</span>
                                <span className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 leading-tight block">
                                    {category.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="bg-white py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
                            How Kaam247 Works
                        </h2>
                        <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            Real people. Real tasks. Nearby help — in minutes.
                        </p>
                    </div>

                    <div className="space-y-8 sm:space-y-10 lg:space-y-12">
                        {/* Task Poster Section */}
                        <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-7 lg:mb-8">
                                <span className="text-2xl sm:text-3xl lg:text-4xl flex-shrink-0">👤</span>
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                                    If you need help (Task Poster)
                                </h3>
                            </div>
                            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-sm sm:text-base">1</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Post what you need done</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">
                                            Describe the task, set your budget, choose location and time.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-sm sm:text-base">2</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Nearby helpers get notified</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">
                                            Only people close to you see the task — no agencies, no spam.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-sm sm:text-base">3</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Get the work done</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">
                                            Connect directly, complete the task, and mark it done.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Worker Section */}
                        <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-7 lg:mb-8">
                                <span className="text-2xl sm:text-3xl lg:text-4xl flex-shrink-0">🧑‍🔧</span>
                                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 leading-tight">
                                    If you want to earn (Worker)
                                </h3>
                            </div>
                            <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-bold text-sm sm:text-base">1</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Go online when you're available</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">
                                            Turn on availability to receive nearby task alerts.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-bold text-sm sm:text-base">2</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Accept tasks you want to do</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">
                                            Choose tasks that match your skills, time, and distance.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-bold text-sm sm:text-base">3</span>
                                    </div>
                                    <div className="flex-1 pt-0.5">
                                        <h4 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-sm sm:text-base lg:text-lg">Complete & get rated</h4>
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-600 leading-relaxed">
                                            Finish the task, build your profile, and get more work.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Points */}
                    <div className="mt-10 sm:mt-12 lg:mt-16 pt-8 sm:pt-10 lg:pt-12 border-t border-gray-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
                            <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                                <span className="text-xl sm:text-2xl lg:text-3xl">✔</span>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 leading-tight">Verified users</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                                <span className="text-xl sm:text-2xl lg:text-3xl">✔</span>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 leading-tight">Direct contact</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                                <span className="text-xl sm:text-2xl lg:text-3xl">✔</span>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 leading-tight">Hyperlocal matching</p>
                            </div>
                            <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                                <span className="text-xl sm:text-2xl lg:text-3xl">✔</span>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-gray-700 leading-tight">Safe & reliable</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    )
}

export default Home
