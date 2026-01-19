# 🚀 Start Backend Server

## Quick Start

```bash
cd server
npm run dev
```

The server will start on **http://localhost:3001**

## Verify It's Running

Open in browser: http://localhost:3001/health

Should see: `{"status":"OK","message":"Kaam247 backend running"}`

## Troubleshooting

**Port 3001 already in use:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in server/.env
PORT=3002
```

**MongoDB connection error:**
- Check MongoDB is running: `mongosh` or `brew services start mongodb-community`
- Verify `MONGO_URI` in `server/.env`
