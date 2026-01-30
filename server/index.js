const express = require('express')
const http = require('http')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config({ silent: true })
const connectDB = require('./config/db')
const taskRoutes = require('./routes/taskRoutes')
const userRoutes = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')
const adminRoutes = require('./routes/adminRoutes')
const reportRoutes = require('./routes/reportRoutes')
const geocodeRoutes = require('./routes/geocodeRoutes')
const configRoutes = require('./routes/configRoutes')
const { initializeSocket } = require('./socket/socketHandler')

const app = express()
const server = http.createServer(app)
// Trust proxy (Render / HTTPS) so secure cookies & protocol detection work correctly
app.set('trust proxy', 1)
const PORT = process.env.PORT || 3001

// Initialize Socket.IO
initializeSocket(server)

// Middleware
// CORS configuration - production origins + localhost in development
const allowedOrigins = [
  'https://kaam247.in',
  'https://www.kaam247.in'
]
const devOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
]
const corsOrigins = process.env.NODE_ENV === 'production'
  ? allowedOrigins
  : [...allowedOrigins, ...devOrigins]

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true)

    const isAllowed = corsOrigins.includes(origin)
    if (isAllowed) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true, // Required for cookies in cross-origin requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'] // Expose Set-Cookie header
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

// Request logging middleware (only log in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => { next() })
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
app.use('/api', geocodeRoutes)
app.use('/api', configRoutes)
app.use('/api/admin', adminRoutes)

// 404 handler
app.use((req, res) => {
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
    }

    // Start server with Socket.IO
    server.listen(PORT, () => { })
  } catch (error) {
    process.exit(1)
  }
}

startServer()

