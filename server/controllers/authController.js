const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')

const JWT_SECRET = process.env.JWT_SECRET
const isProduction = process.env.NODE_ENV === 'production'

// Require JWT_SECRET in production
if (isProduction && (!JWT_SECRET || JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must be set and at least 32 characters in production')
}

// Generate JWT token
const generateToken = (userId) => {
  const secret = JWT_SECRET || (isProduction ? null : 'dev-secret-change-in-production')
  if (!secret) throw new Error('JWT_SECRET is required')
  return jwt.sign({ userId }, secret, { expiresIn: '7d' })
}

// Cookie options: secure only in production (HTTPS), sameSite for cross-origin
const getCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
})

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

    // Validate password strength (min 8 chars for better security)
    if (password.length < 8) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Password must be at least 8 characters long'
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      })
    }

    // Validate phone: 10-digit (digits only)
    const phoneDigits = phone.trim().replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      return res.status(400).json({
        error: 'Invalid phone',
        message: 'Please provide a valid 10-digit phone'
      })
    }

    // Check if user already exists (by email or phone)
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone: phoneDigits }]
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

    // Create user (store phone as digits only)
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phoneDigits,
      password: hashedPassword,
      role: 'user', // Default role (admin is set manually in DB)
      roleMode: 'worker' // User mode (worker or poster)
    })

    const savedUser = await user.save()

    // Generate token
    const token = generateToken(savedUser._id)

    res.cookie('token', token, getCookieOptions())

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
        roleMode: savedUser.roleMode,
        profileSetupCompleted: true // Email/phone signup has full details
      }
    })
  } catch (error) {
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

    res.cookie('token', token, getCookieOptions())

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
        roleMode: user.roleMode,
        profileSetupCompleted: user.profileSetupCompleted !== false
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while logging in'
    })
  }
}

// Logout user - clear cookie
const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    })

    return res.status(200).json({
      message: 'Logout successful'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while logging out'
    })
  }
}

// POST /api/auth/google - Google Sign-In: verify idToken, create/find user, return JWT
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID?.trim() || ''
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({
        error: 'Missing idToken',
        message: 'Google idToken is required'
      })
    }
    if (!GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        error: 'Google auth not configured',
        message: 'GOOGLE_CLIENT_ID is not set on the server'
      })
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID)
    const ticket = await client.verifyIdToken({
      idToken: idToken.trim(),
      audience: GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()
    if (!payload || !payload.sub) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Could not verify Google token'
      })
    }

    const googleId = payload.sub
    const email = payload.email ? payload.email.toLowerCase().trim() : null
    const name = payload.name || payload.given_name || payload.family_name || 'User'
    const picture = payload.picture || null

    let user = await User.findOne({ googleId })
    if (!user && email) {
      user = await User.findOne({ email })
    }
    if (!user) {
      user = new User({
        name: name.trim() || 'User',
        email: email || undefined,
        googleId,
        profileSetupCompleted: false,
        role: 'user',
        roleMode: 'worker',
        profilePhoto: picture || undefined
      })
      await user.save()
    } else if (!user.googleId) {
      user.googleId = googleId
      if (picture) user.profilePhoto = picture
      await user.save()
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.'
      })
    }

    // Require name and 10-digit phone for Google sign-in: cannot bypass setup
    const nameOk = user.name && String(user.name).trim().length > 0
    const phoneDigits = (user.phone && String(user.phone).replace(/\D/g, '')) || ''
    const phoneOk = phoneDigits.length === 10
    if (!nameOk || !phoneOk) {
      user.profileSetupCompleted = false
      await user.save()
    }

    const token = generateToken(user._id)
    res.cookie('token', token, getCookieOptions())

    const profileSetupRequired = user.profileSetupCompleted === false

    return res.status(200).json({
      message: 'Login successful',
      token,
      profileSetupRequired,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleMode: user.roleMode ?? 'worker',
        profileSetupCompleted: user.profileSetupCompleted === true,
        profilePhoto: user.profilePhoto
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Could not authenticate with Google'
    })
  }
}

// PATCH /api/auth/profile-setup - Complete profile after Google sign-in (authenticated)
const completeProfileSetup = async (req, res) => {
  try {
    const userId = req.userId
    const { name, phone } = req.body

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User not found'
      })
    }

    if (user.profileSetupCompleted === true) {
      return res.status(200).json({
        message: 'Profile already completed',
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          roleMode: user.roleMode,
          profileSetupCompleted: true
        }
      })
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid name',
        message: 'Name is required'
      })
    }

    const phoneDigits = String(phone || '').trim().replace(/\D/g, '')
    if (phoneDigits.length !== 10) {
      return res.status(400).json({
        error: 'Invalid phone',
        message: 'Please provide a valid 10-digit phone'
      })
    }

    const existingPhone = await User.findOne({ phone: phoneDigits, _id: { $ne: userId } })
    if (existingPhone) {
      return res.status(400).json({
        error: 'Phone already exists',
        message: 'This phone number is already registered'
      })
    }

    user.name = name.trim()
    user.phone = phoneDigits
    user.profileSetupCompleted = true
    await user.save()

    const token = generateToken(user._id)
    res.cookie('token', token, getCookieOptions())

    return res.status(200).json({
      message: 'Profile setup completed',
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roleMode: user.roleMode,
        profileSetupCompleted: true,
        profilePhoto: user.profilePhoto
      }
    })
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'Failed to complete profile setup'
    })
  }
}

module.exports = {
  register,
  login,
  logout,
  googleLogin,
  completeProfileSetup
}

