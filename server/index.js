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
app.use(cors())
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

