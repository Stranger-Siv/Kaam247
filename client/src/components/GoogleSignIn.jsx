import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function GoogleSignIn({ onSuccess, onError }) {
    const { loginWithGoogle } = useAuth()
    const [isLoading, setIsLoading] = useState(false)

    const handleGoogleSignIn = async () => {
        console.log('🔵 [GoogleSignIn] Button clicked, initiating Google sign-in...')
        setIsLoading(true)
        
        try {
            const result = await loginWithGoogle()
            console.log('📥 [GoogleSignIn] Result from loginWithGoogle:', result)
            
            if (result.success) {
                if (result.redirecting) {
                    console.log('🔄 [GoogleSignIn] Redirecting to Google...')
                    // User is being redirected to Google - show message
                    // The redirect will happen automatically
                    // onSuccess will be called after redirect when user returns
                } else if (onSuccess) {
                    console.log('✅ [GoogleSignIn] Calling onSuccess callback')
                    onSuccess(result)
                }
            } else {
                console.error('❌ [GoogleSignIn] Sign-in failed:', result.error)
                setIsLoading(false)
                if (onError) {
                    onError(result.error)
                }
            }
            // Note: If redirecting, setIsLoading(false) won't be called
            // because the page will redirect to Google
        } catch (error) {
            console.error('❌ [GoogleSignIn] Error during sign-in:', error)
            setIsLoading(false)
            if (onError) {
                onError(error.message || 'Failed to sign in with Google')
            }
        }
    }

    return (
        <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
            {isLoading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 dark:border-gray-300"></div>
                    <span>Signing in...</span>
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    <span>Continue with Google</span>
                </>
            )}
        </button>
    )
}

export default GoogleSignIn
