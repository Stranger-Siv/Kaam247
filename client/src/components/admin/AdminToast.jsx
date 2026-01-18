import { useEffect } from 'react'

function AdminToast({ message, type = 'success', isVisible, onClose }) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose()
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [isVisible, onClose])

    if (!isVisible) return null

    const bgColor = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
        type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
            'bg-blue-50 border-blue-200 text-blue-800'

    return (
        <div className={`fixed top-20 right-6 z-[1500] max-w-md w-full p-4 rounded-lg border-2 shadow-lg ${bgColor}`}>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{message}</p>
                <button
                    onClick={onClose}
                    className="ml-4 text-current opacity-70 hover:opacity-100"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default AdminToast

