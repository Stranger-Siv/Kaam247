const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

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

    // Set JWT token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Only send over HTTPS
      sameSite: 'none', // Required for cross-origin requests
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    })

    // Return user data (without password) and token
    return res.status(201).json({
      message: 'User registered successfully',
      token, // Also return in response for backward compatibility
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

    // Set JWT token in HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Only send over HTTPS
      sameSite: 'none', // Required for cross-origin requests
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    })

    // Return user data (without password) and token
    return res.status(200).json({
      message: 'Login successful',
      token, // Also return in response for backward compatibility
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
    res.status(500).json({
      error: 'Server error',
      message: error.message || 'An error occurred while logging in'
    })
  }
}

// Logout user - clear cookie
const logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
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

module.exports = {
  register,
  login,
  logout
}

