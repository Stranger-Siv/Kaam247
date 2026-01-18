# Render Deployment Guide for Kaam247

This guide will help you deploy Kaam247 to Render (https://kaam247.onrender.com).

## Prerequisites

1. MongoDB database (MongoDB Atlas recommended for production)
2. Render account with backend and frontend services set up

## Backend Deployment (Server)

### Environment Variables to Set in Render

Go to your Render backend service → Environment → Add the following variables:

1. **MONGO_URI**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/kaam247?retryWrites=true&w=majority
   ```
   - Replace with your MongoDB Atlas connection string
   - Or use your MongoDB connection string

2. **JWT_SECRET**
   ```
   [Generate a strong random string - at least 32 characters]
   ```
   - Use a strong, random secret key
   - Example: `openssl rand -base64 32`

3. **PORT**
   ```
   3001
   ```
   - Render will automatically set this, but you can specify it

4. **NODE_ENV**
   ```
   production
   ```

### Backend Build & Start Commands

- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && node index.js`

### Backend Health Check

Your backend should be accessible at:
- `https://your-backend-name.onrender.com/health`

---

## Frontend Deployment (Client)

### Environment Variables to Set in Render

Go to your Render frontend service → Environment → Add the following variables:

1. **VITE_API_BASE_URL**
   ```
   https://your-backend-name.onrender.com
   ```
   - Replace `your-backend-name` with your actual Render backend service name
   - Example: `https://kaam247-backend.onrender.com`

2. **VITE_SOCKET_URL**
   ```
   https://your-backend-name.onrender.com
   ```
   - Same as API_BASE_URL (backend handles both API and Socket.IO)

### Frontend Build & Start Commands

- **Build Command**: `cd client && npm install && npm run build`
- **Start Command**: `cd client && npm run preview` (or use a static site server)

**OR** if using Render's static site:
- **Build Command**: `cd client && npm install && npm run build`
- **Publish Directory**: `client/dist`

---

## CORS Configuration

The backend CORS is configured to allow:
- `kaam247.onrender.com` (your frontend domain)
- `localhost` (for local development)

If you need to add more domains, edit `server/index.js` and update the `corsOptions.origin` function.

---

## Quick Setup Checklist

### Backend:
- [ ] Set `MONGO_URI` environment variable
- [ ] Set `JWT_SECRET` environment variable (strong random string)
- [ ] Set `NODE_ENV=production`
- [ ] Verify backend is accessible at `/health` endpoint
- [ ] Test API endpoints

### Frontend:
- [ ] Set `VITE_API_BASE_URL` to your backend URL
- [ ] Set `VITE_SOCKET_URL` to your backend URL
- [ ] Build and deploy
- [ ] Test frontend can connect to backend

---

## Testing After Deployment

1. **Backend Health Check**:
   ```bash
   curl https://your-backend.onrender.com/health
   ```
   Should return: `{"status":"OK","message":"Kaam247 backend running"}`

2. **Frontend Connection**:
   - Open https://kaam247.onrender.com
   - Check browser console for connection errors
   - Try logging in/registering

3. **Socket.IO Connection**:
   - Check browser console for Socket.IO connection status
   - Should see successful connection messages

---

## Troubleshooting

### Backend Issues:
- **MongoDB Connection Failed**: Check `MONGO_URI` is correct and MongoDB allows connections from Render IPs
- **CORS Errors**: Verify frontend URL is in CORS allowed origins
- **Port Issues**: Render sets PORT automatically, don't hardcode it

### Frontend Issues:
- **API Not Connecting**: Verify `VITE_API_BASE_URL` matches your backend URL exactly
- **Socket Not Connecting**: Verify `VITE_SOCKET_URL` matches your backend URL
- **Build Fails**: Check Node.js version in `package.json` matches Render's supported versions

---

## Notes

- Render free tier services spin down after inactivity (15 minutes)
- First request after spin-down may take 30-60 seconds
- Consider upgrading to paid tier for always-on services
- MongoDB Atlas free tier is sufficient for development/testing

---

## Example Environment Variables Summary

### Backend (.env):
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/kaam247?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
PORT=3001
NODE_ENV=production
```

### Frontend (.env):
```env
VITE_API_BASE_URL=https://kaam247-backend.onrender.com
VITE_SOCKET_URL=https://kaam247-backend.onrender.com
```

---

**Last Updated**: Based on current codebase structure

