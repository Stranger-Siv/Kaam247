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

// Complete profile setup after Google authentication
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

    // Check if user already exists - first by Google ID (most reliable)
    let user = await User.findOne({ googleId })

    // If not found by Google ID, check by email
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase().trim() })
    }

    if (user) {
      // Existing user - link Google ID if not already linked
      let needsSave = false
      
      if (!user.googleId) {
        // Check if another user already has this googleId (shouldn't happen, but safety check)
        const existingGoogleUser = await User.findOne({ googleId })
        if (existingGoogleUser && existingGoogleUser._id.toString() !== user._id.toString()) {
          return res.status(400).json({
            error: 'Account conflict',
            message: 'This Google account is already linked to another account. Please contact support.'
          })
        }
        user.googleId = googleId
        needsSave = true
      } else if (user.googleId !== googleId) {
        // User has a different Google ID - this shouldn't happen, but handle it
        return res.status(400).json({
          error: 'Account mismatch',
          message: 'This account is linked to a different Google account. Please use the correct Google account.'
        })
      }

      // Update profile photo if available and not set
      if (profilePhoto && !user.profilePhoto) {
        user.profilePhoto = profilePhoto
        needsSave = true
      }

      // Update email if not set and Google provides one
      if (email && !user.email) {
        user.email = email.toLowerCase().trim()
        needsSave = true
      }

      // Update name if it's still a temporary name
      if (user.name && user.name.startsWith('User_') && name) {
        user.name = name.trim()
        needsSave = true
      }

      if (needsSave) {
        try {
          await user.save()
        } catch (saveError) {
          // If save fails due to duplicate, handle gracefully
          if (saveError.code === 11000) {
            return res.status(400).json({
              error: 'Account conflict',
              message: 'Unable to link Google account. Please contact support.'
            })
          }
          throw saveError
        }
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
      // Check if googleId already exists (shouldn't happen, but safety check)
      const existingGoogleUser = await User.findOne({ googleId })
      if (existingGoogleUser) {
        // This user already exists with this Google ID - log them in instead
        const token = generateToken(existingGoogleUser._id)
        return res.status(200).json({
          message: 'Login successful',
          token,
          user: {
            _id: existingGoogleUser._id,
            id: existingGoogleUser._id,
            name: existingGoogleUser.name,
            email: existingGoogleUser.email,
            phone: existingGoogleUser.phone,
            role: existingGoogleUser.role,
            roleMode: existingGoogleUser.roleMode,
            profilePhoto: existingGoogleUser.profilePhoto,
            profileSetupCompleted: existingGoogleUser.profileSetupCompleted
          },
          requiresProfileSetup: !existingGoogleUser.profileSetupCompleted && !existingGoogleUser.phone
        })
      }

      // Create new user
      const newUser = new User({
        googleId,
        email: email?.toLowerCase().trim() || null,
        name: name.trim(),
        profilePhoto,
        phone: null, // Phone can be added later
        phoneVerified: false,
        profileSetupCompleted: !!email, // If email exists, profile is mostly complete
        role: 'user',
        roleMode: 'worker'
      })

      try {
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
      } catch (saveError) {
        // If duplicate key error, try to find the existing user
        if (saveError.code === 11000) {
          // Try to find user by the duplicate field
          if (saveError.keyPattern?.googleId) {
            const existingUser = await User.findOne({ googleId })
            if (existingUser) {
              const token = generateToken(existingUser._id)
              return res.status(200).json({
                message: 'Login successful',
                token,
                user: {
                  _id: existingUser._id,
                  id: existingUser._id,
                  name: existingUser.name,
                  email: existingUser.email,
                  phone: existingUser.phone,
                  role: existingUser.role,
                  roleMode: existingUser.roleMode,
                  profilePhoto: existingUser.profilePhoto,
                  profileSetupCompleted: existingUser.profileSetupCompleted
                },
                requiresProfileSetup: !existingUser.profileSetupCompleted && !existingUser.phone
              })
            }
          }
          
          return res.status(400).json({
            error: 'User already exists',
            message: 'An account with this information already exists. Please try logging in instead.'
          })
        }
        throw saveError
      }
    }
  } catch (error) {
    console.error('Error verifying Google auth:', error)

    // Duplicate key errors are already handled above
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Account conflict',
        message: 'An account with this information already exists. Please try logging in with your existing account.'
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
  verifyGoogleAuth,
  completeProfileSetup
}

