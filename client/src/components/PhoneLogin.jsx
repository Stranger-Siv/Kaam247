import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

function PhoneLogin({ onSuccess, onCancel }) {
    const { loginWithPhone, verifyPhoneOTP } = useAuth()
    const [step, setStep] = useState('phone') // 'phone' or 'otp'
    const [phoneNumber, setPhoneNumber] = useState('')
    const [otp, setOtp] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [confirmationResult, setConfirmationResult] = useState(null)
    const [countdown, setCountdown] = useState(0)
    const otpInputRef = useRef(null)

    // Countdown timer for resend OTP
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    // Focus OTP input when step changes
    useEffect(() => {
        if (step === 'otp' && otpInputRef.current) {
            otpInputRef.current.focus()
        }
    }, [step])

    const handlePhoneSubmit = async (e) => {
        e.preventDefault()
        setError('')
        
        if (!phoneNumber || phoneNumber.trim().length < 10) {
            setError('Please enter a valid phone number')
            return
        }

        setIsLoading(true)

        // Ensure phone number has country code (default to +91 for India)
        let formattedPhone = phoneNumber.trim()
        if (!formattedPhone.startsWith('+')) {
            // If it starts with 0, remove it and add +91
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '+91' + formattedPhone.substring(1)
            } else if (formattedPhone.length === 10) {
                formattedPhone = '+91' + formattedPhone
            } else {
                formattedPhone = '+' + formattedPhone
            }
        }

        const result = await loginWithPhone(formattedPhone)

        if (result.success) {
            setConfirmationResult(result.confirmationResult)
            setStep('otp')
            setCountdown(60) // 60 seconds countdown
        } else {
            setError(result.error || 'Failed to send OTP')
        }

        setIsLoading(false)
    }

    const handleOTPSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!otp || otp.length !== 6) {
            setError('Please enter the 6-digit OTP')
            return
        }

        if (!confirmationResult) {
            setError('Session expired. Please try again.')
            setStep('phone')
            return
        }

        setIsLoading(true)

        const result = await verifyPhoneOTP(confirmationResult, otp, phoneNumber)

        if (result.success) {
            if (result.requiresProfileSetup) {
                // User needs to complete profile setup
                onSuccess({ requiresProfileSetup: true, user: result.user })
            } else {
                // User is fully authenticated
                onSuccess({ requiresProfileSetup: false, user: result.user })
            }
        } else {
            setError(result.error || 'Invalid OTP. Please try again.')
        }

        setIsLoading(false)
    }

    const handleResendOTP = async () => {
        if (countdown > 0) return

        setError('')
        setIsLoading(true)

        let formattedPhone = phoneNumber.trim()
        if (!formattedPhone.startsWith('+')) {
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '+91' + formattedPhone.substring(1)
            } else if (formattedPhone.length === 10) {
                formattedPhone = '+91' + formattedPhone
            } else {
                formattedPhone = '+' + formattedPhone
            }
        }

        const result = await loginWithPhone(formattedPhone)

        if (result.success) {
            setConfirmationResult(result.confirmationResult)
            setOtp('')
            setCountdown(60)
            setError('')
        } else {
            setError(result.error || 'Failed to resend OTP')
        }

        setIsLoading(false)
    }

    const handleBack = () => {
        setStep('phone')
        setOtp('')
        setError('')
        setConfirmationResult(null)
    }

    // reCAPTCHA container (invisible)
    useEffect(() => {
        // Create reCAPTCHA container if it doesn't exist
        if (!document.getElementById('recaptcha-container')) {
            const container = document.createElement('div')
            container.id = 'recaptcha-container'
            container.style.display = 'none'
            document.body.appendChild(container)
        }
    }, [])

    return (
        <div className="space-y-5">
            {step === 'phone' ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm">
                                +91
                            </span>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '')
                                    if (value.length <= 10) {
                                        setPhoneNumber(value)
                                        setError('')
                                    }
                                }}
                                placeholder="Enter your 10-digit phone number"
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base"
                                required
                                maxLength={10}
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            We'll send you a 6-digit verification code
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex-1 px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-base min-h-[48px] ${
                                isLoading
                                    ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed'
                                    : 'hover:bg-blue-700 dark:hover:bg-blue-600'
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Sending OTP...
                                </span>
                            ) : (
                                'Send OTP'
                            )}
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleOTPSubmit} className="space-y-5">
                    <div>
                        <button
                            type="button"
                            onClick={handleBack}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 mb-4 flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Change phone number
                        </button>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Enter 6-digit OTP
                        </label>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            We sent a code to <span className="font-semibold">+91 {phoneNumber}</span>
                        </p>
                        <input
                            ref={otpInputRef}
                            type="text"
                            value={otp}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                                setOtp(value)
                                setError('')
                            }}
                            placeholder="000000"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-center text-2xl font-mono tracking-widest"
                            required
                            maxLength={6}
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={countdown > 0 || isLoading}
                            className={`text-sm ${
                                countdown > 0
                                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500'
                            }`}
                        >
                            {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || otp.length !== 6}
                        className={`w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-base min-h-[48px] ${
                            isLoading || otp.length !== 6
                                ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed'
                                : 'hover:bg-blue-700 dark:hover:bg-blue-600'
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Verifying...
                            </span>
                        ) : (
                            'Verify OTP'
                        )}
                    </button>
                </form>
            )}
        </div>
    )
}

export default PhoneLogin
