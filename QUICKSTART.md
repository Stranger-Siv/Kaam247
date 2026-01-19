# 🚀 Quick Start Guide

## Prerequisites Check

```bash
# Check Node.js (need v18+)
node -v

# Check npm
npm -v

# Check MongoDB (optional - can use Atlas)
mongod --version
```

## One-Command Setup

```bash
# Run setup script
./setup.sh
```

Or manually:

## Manual Setup

### 1. Install Dependencies

```bash
# Server
cd server
npm install

# Client  
cd ../client
npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cd ../server
cp .env.example .env

# Edit .env and set:
# - MONGO_URI (your MongoDB connection string)
# - JWT_SECRET (any random string)
```

**MongoDB Options:**
- **Local**: `mongodb://localhost:27017/kaam247`
- **Atlas**: Get connection string from MongoDB Atlas dashboard

### 3. Start MongoDB (if using local)

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Or run manually
mongod
```

### 4. Start the App

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

### 5. Open Browser

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## First Time Setup

1. **Register** a new account at http://localhost:5173/register
2. **Login** with your credentials
3. **Choose mode**: Worker or Poster
4. **Start using** the app!

## Troubleshooting

**MongoDB Connection Error:**
- Check MongoDB is running: `mongosh` or `mongod --version`
- Verify `MONGO_URI` in `server/.env`
- For Atlas: Check IP whitelist and connection string

**Port Already in Use:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**CORS Errors:**
- Ensure server is running on port 3001
- Ensure client is running on port 5173
- Check browser console for specific errors

## Development Tips

- Server auto-restarts with `nodemon` (npm run dev)
- Client hot-reloads on file changes (Vite)
- Check `server/server.log` for server logs
- Use browser DevTools (F12) for client debugging

## Need Help?

Check `README.md` for detailed documentation.
