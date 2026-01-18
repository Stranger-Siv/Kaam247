const express = require('express')
const http = require('http')
const cors = require('cors')
require('dotenv').config({ silent: true })
const connectDB = require('./config/db')
const taskRoutes = require('./routes/taskRoutes')
const userRoutes = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const reportRoutes = require('./routes/reportRoutes')
const { initializeSocket } = require('./socket/socketHandler')

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3001

// Initialize Socket.IO
initializeSocket(server)

// Middleware
// CORS configuration - allow Netlify frontend, Render frontend, and local development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)

    // List of allowed origins
    const allowedOrigins = [
      'https://kaam247.in',                     // Custom domain (production)
      'https://www.kaam247.in',                 // Custom domain with www (production)
      'https://kaam247.netlify.app',           // Netlify frontend (production)
      'https://kaam247.onrender.com',           // Render frontend (if deployed there)
      'http://localhost:5173',                  // Vite dev server
      'http://localhost:3000',                  // Alternative dev port
      'http://localhost:3001',                 // Local backend (for testing)
      'http://127.0.0.1:5173',                  // Alternative localhost format
      'http://127.0.0.1:3000',                  // Alternative localhost format
    ]

    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Exact match
      if (origin === allowedOrigin) return true
      // For localhost, also check if it starts with http://localhost or http://127.0.0.1
      if (allowedOrigin.includes('localhost') && origin.includes('localhost')) return true
      if (allowedOrigin.includes('127.0.0.1') && origin.includes('127.0.0.1')) return true
      return false
    })

    if (isAllowed) {
      callback(null, true)
    } else {
      // Log blocked origin for debugging
      console.log('CORS: Blocked origin:', origin)
      // In development, allow all origins for easier testing
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
}
app.use(cors(corsOptions))
app.use(express.json())

// Request logging middleware (only log in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    next()
  })
}

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Kaam247 backend running'
  })
})

// API Routes
app.use('/api', authRoutes)
app.use('/api', taskRoutes)
app.use('/api', userRoutes)
app.use('/api', reportRoutes)
app.use('/api/admin', adminRoutes)

// 404 handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url)
  res.status(404).json({
    error: 'Route not found',
    message: `${req.method} ${req.url} not found`
  })
})

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    try {
      await connectDB()
    } catch (dbError) {
      console.error('MongoDB connection failed, but server is running:', dbError.message)
      console.log('Server will continue without database connection')
    }

    // Start server with Socket.IO
    server.listen(PORT, () => {
      console.log(`Server running at port ${PORT}`)
      console.log(`Health check: http://localhost:${PORT}/health`)
      console.log(`Socket.IO ready for connections`)
    })
  } catch (error) {
    console.error('Failed to start server:', error.message)
    process.exit(1)
  }
}

startServer()

