const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const firebaseAdmin = require('../config/firebase')

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'kaam247_secret_key_change_in_production', {
    expiresIn: '30d'
  })
}

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide: name, email, phone, and password'
      })
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password must be at least 6 characters long'
      })
    }

    // Check if user already exists (by email or phone)
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }]
    })

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: existingUser.email === email.toLowerCase().trim()
          ? 'A user with this email already exists'
          : 'A user with this phone number already exists'
      })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: 'user', // Default role (admin is set manually in DB)
      roleMode: 'worker' // User mode (worker or poster)
    })

    const savedUser = await user.save()

    // Generate token
    const token = generateToken(savedUser._id)

    // Return user data (without password) and token
    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: savedUser._id,
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
        roleMode: savedUser.roleMode
      }
    })
  } catch (error) {
    console.error('Error registering user:', error)

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({
        error: 'Validation error',
        message: validationErrors.join(', ')
      })
    }

    if (error.code === 11000) {
      // Duplicate key error
      let duplicateField = 'email'
      if (error.message.includes('phone')) {
        duplicateField = 'phone'
      }
      return res.status(400).json({
        error: `Duplicate ${duplicateField}`,
        message: `A user with this ${duplicateField} already exists`
      })
    }

    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while registering the user'
    })
  }
}

// Login user
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body

    // Validate required fields
    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide: identifier (email or phone) and password'
      })
    }

    // Find user by email or phone
    // Need to explicitly select password field since it's set to select: false in schema
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { phone: identifier.trim() }
      ]
    }).select('+password')

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email/phone or password'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.'
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email/phone or password'
      })
    }

    // Generate token
    const token = generateToken(user._id)

    // Return user data (without password) and token
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleMode: user.roleMode
      }
    })
  } catch (error) {
    console.error('Error logging in user:', error)

    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while logging in'
    })
  }
}

// Verify Firebase ID token and authenticate user (for phone OTP)
const verifyPhoneOTP = async (req, res) => {
  try {
    const { idToken, phoneNumber } = req.body

    if (!idToken || !phoneNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide: idToken and phoneNumber'
      })
    }

    // Check if Firebase Admin is initialized
    if (!firebaseAdmin) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Firebase authentication is not configured. Please contact support.'
      })
    }

    // Verify the Firebase ID token
    let decodedToken
    try {
      decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken)
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Invalid or expired authentication token'
      })
    }

    // Verify phone number matches
    if (decodedToken.phone_number !== phoneNumber) {
      return res.status(400).json({
        error: 'Phone mismatch',
        message: 'Phone number does not match the authenticated token'
      })
    }

    const firebaseUID = decodedToken.uid
    const verifiedPhone = decodedToken.phone_number

    // Check if user already exists (by Firebase UID or phone)
    let user = await User.findOne({
      $or: [
        { firebaseUID },
        { phone: verifiedPhone }
      ]
    })

    if (user) {
      // Existing user - update Firebase UID if not set
      if (!user.firebaseUID) {
        user.firebaseUID = firebaseUID
        user.phoneVerified = true
        await user.save()
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact support.'
        })
      }

      // Generate JWT token
      const token = generateToken(user._id)

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          roleMode: user.roleMode,
          profileSetupCompleted: user.profileSetupCompleted
        },
        requiresProfileSetup: !user.profileSetupCompleted
      })
    } else {
      // New user - create account with minimal info
      // User will complete profile setup after authentication
      const newUser = new User({
        phone: verifiedPhone,
        firebaseUID,
        phoneVerified: true,
        name: `User_${verifiedPhone.slice(-4)}`, // Temporary name
        profileSetupCompleted: false,
        role: 'user',
        roleMode: 'worker'
      })

      const savedUser = await newUser.save()

      // Generate JWT token
      const token = generateToken(savedUser._id)

      return res.status(201).json({
        message: 'Account created successfully. Please complete your profile.',
        token,
        user: {
          _id: savedUser._id,
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          phone: savedUser.phone,
          role: savedUser.role,
          roleMode: savedUser.roleMode,
          profileSetupCompleted: savedUser.profileSetupCompleted
        },
        requiresProfileSetup: true
      })
    }
  } catch (error) {
    console.error('Error verifying phone OTP:', error)

    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this phone number already exists'
      })
    }

    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred during phone authentication'
    })
  }
}

// Complete profile setup after Firebase phone authentication
const completeProfileSetup = async (req, res) => {
  try {
    const userId = req.userId // From auth middleware
    const { name, email } = req.body

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid name',
        message: 'Name is required'
      })
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    // Check if profile already completed
    if (user.profileSetupCompleted) {
      return res.status(400).json({
        error: 'Profile already completed',
        message: 'Profile setup has already been completed'
      })
    }

    // Update user profile
    user.name = name.trim()
    if (email && email.trim().length > 0) {
      // Check if email is already taken
      const existingUser = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: userId }
      })
      if (existingUser) {
        return res.status(400).json({
          error: 'Email already exists',
          message: 'This email is already registered'
        })
      }
      user.email = email.toLowerCase().trim()
    }

    user.profileSetupCompleted = true
    await user.save()

    // Generate new token with updated user info
    const token = generateToken(user._id)

    return res.status(200).json({
      message: 'Profile setup completed successfully',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleMode: user.roleMode,
        profileSetupCompleted: user.profileSetupCompleted
      }
    })
  } catch (error) {
    console.error('Error completing profile setup:', error)

    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate email',
        message: 'This email is already registered'
      })
    }

    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred during profile setup'
    })
  }
}

// Verify Google ID token and authenticate user
const verifyGoogleAuth = async (req, res) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide: idToken'
      })
    }

    // Check if Firebase Admin is initialized
    if (!firebaseAdmin) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Firebase authentication is not configured. Please contact support.'
      })
    }

    // Verify the Firebase ID token (from Google Sign-In)
    let decodedToken
    try {
      decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken)
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Invalid or expired authentication token'
      })
    }

    // Extract user information from Google
    const googleId = decodedToken.uid
    const email = decodedToken.email
    const name = decodedToken.name || decodedToken.email?.split('@')[0] || 'User'
    const profilePhoto = decodedToken.picture || null

    // Check if user already exists (by Google ID or email)
    let user = await User.findOne({
      $or: [
        { googleId },
        { email: email?.toLowerCase().trim() }
      ]
    })

    if (user) {
      // Existing user - update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId
        await user.save()
      }

      // Update profile photo if available and not set
      if (profilePhoto && !user.profilePhoto) {
        user.profilePhoto = profilePhoto
        await user.save()
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact support.'
        })
      }

      // Generate JWT token
      const token = generateToken(user._id)

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          roleMode: user.roleMode,
          profilePhoto: user.profilePhoto,
          profileSetupCompleted: user.profileSetupCompleted
        },
        requiresProfileSetup: !user.profileSetupCompleted && !user.phone
      })
    } else {
      // New user - create account with Google info
      // If email exists, use it; otherwise phone will be required later
      const newUser = new User({
        googleId,
        email: email?.toLowerCase().trim() || null,
        name: name.trim(),
        profilePhoto,
        phone: null, // Phone can be added later
        phoneVerified: false,
        profileSetupCompleted: !email, // If no email, needs setup; if email exists, profile is mostly complete
        role: 'user',
        roleMode: 'worker'
      })

      const savedUser = await newUser.save()

      // Generate JWT token
      const token = generateToken(savedUser._id)

      return res.status(201).json({
        message: 'Account created successfully.',
        token,
        user: {
          _id: savedUser._id,
          id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
          phone: savedUser.phone,
          role: savedUser.role,
          roleMode: savedUser.roleMode,
          profilePhoto: savedUser.profilePhoto,
          profileSetupCompleted: savedUser.profileSetupCompleted
        },
        requiresProfileSetup: !savedUser.phone // Need phone for full functionality
      })
    }
  } catch (error) {
    console.error('Error verifying Google auth:', error)

    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        error: 'User already exists',
        message: 'A user with this Google account already exists'
      })
    }

    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred during Google authentication'
    })
  }
}

module.exports = {
  register,
  login,
  verifyPhoneOTP,
  verifyGoogleAuth,
  completeProfileSetup
}

