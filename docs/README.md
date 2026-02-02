# Kaam247 - Local Development Setup

## Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn**

## Quick Start

### 1. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Set Up Environment Variables

#### Server Setup

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and configure:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/kaam247
JWT_SECRET=your-secret-key-change-this-in-production
```

**MongoDB Options:**
- **Local MongoDB**: `mongodb://localhost:27017/kaam247`
- **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/kaam247`

#### Client Setup (Optional)

The client automatically uses `http://localhost:3001` in development mode. If you need to override:

```bash
cd client
cp .env.example .env.local
```

Edit `client/.env.local` if needed (usually not required for local development).

### 3. Start MongoDB

**Option A: Local MongoDB**
```bash
# macOS (using Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# Start MongoDB service from Services panel
```

**Option B: MongoDB Atlas**
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a cluster and get your connection string
- Update `MONGO_URI` in `server/.env`

### 4. Start the Application

**Terminal 1 - Start Server:**
```bash
cd server
npm run dev
```

Server will run on: `http://localhost:3001`

**Terminal 2 - Start Client:**
```bash
cd client
npm run dev
```

Client will run on: `http://localhost:5173`

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## Development Scripts

### Server

```bash
cd server

# Start with nodemon (auto-restart on changes)
npm run dev

# Start production mode
npm start

# Run API tests
npm test
```

### Client

```bash
cd client

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
Kaam247/
├── client/          # React frontend (Vite + React)
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── utils/
│   └── package.json
│
└── server/          # Express backend
    ├── config/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── socket/
    └── package.json
```

## Troubleshooting

### MongoDB Connection Issues

**Error**: `MongoDB connection error`

**Solutions**:
1. Ensure MongoDB is running: `mongosh` or check service status
2. Verify `MONGO_URI` in `server/.env` is correct
3. Check MongoDB logs for errors
4. For MongoDB Atlas: Ensure your IP is whitelisted

### Port Already in Use

**Error**: `Port 3001 is already in use`

**Solutions**:
1. Change `PORT` in `server/.env`
2. Kill the process using the port:
   ```bash
   # macOS/Linux
   lsof -ti:3001 | xargs kill -9
   ```

### CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solutions**:
1. Ensure server is running on port 3001
2. Ensure client is running on port 5173
3. Check `server/index.js` CORS configuration includes `http://localhost:5173`

### Socket.IO Connection Issues

**Error**: `WebSocket connection failed`

**Solutions**:
1. Ensure server is running and Socket.IO is initialized
2. Check `SOCKET_ENABLED` is `true` in `client/src/config/env.js`
3. Verify `SOCKET_URL` points to `http://localhost:3001` in development

## Environment Variables Reference

### Server (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `MONGO_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |

### Client (.env.local)

| Variable | Description | Default (Dev) |
|----------|-------------|---------------|
| `VITE_API_BASE_URL` | API base URL | `http://localhost:3001` |
| `VITE_SOCKET_URL` | Socket.IO URL | `http://localhost:3001` |

## Testing

### Test Server APIs

```bash
cd server
npm test
```

### Test Client Locally

1. Start server: `cd server && npm run dev`
2. Start client: `cd client && npm run dev`
3. Open http://localhost:5173
4. Register a new account or login
5. Test features:
   - Post tasks (Poster mode)
   - Accept tasks (Worker mode)
   - Real-time updates via Socket.IO

## Production Deployment

See deployment guides:
- **Frontend**: Deploy to Netlify/Vercel
- **Backend**: Deploy to Render/Railway/Heroku

## Support

For issues or questions, check:
- Server logs: `server/server.log`
- Browser console: F12 → Console
- Network tab: F12 → Network


