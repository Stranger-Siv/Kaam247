# Environment Variables

This project uses environment variables for configuration. All environment variables must be prefixed with `VITE_` to be accessible in the browser.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   ```env
   VITE_API_BASE_URL=http://localhost:3001
   VITE_SOCKET_URL=http://localhost:3001
   ```

## Environment Variables

### `VITE_API_BASE_URL`
- **Description**: Base URL for the backend API
- **Default**: `http://localhost:3001`
- **Example**: `http://localhost:3001` or `https://api.kaam247.com`

### `VITE_SOCKET_URL`
- **Description**: URL for Socket.IO server
- **Default**: `http://localhost:3001`
- **Example**: `http://localhost:3001` or `https://socket.kaam247.com`

## Usage

Environment variables are accessed through the centralized config file:

```javascript
import { API_BASE_URL, SOCKET_URL } from './config/env'
```

## Development vs Production

- **Development**: Uses `.env` file
- **Production**: Set environment variables in your hosting platform (Vercel, Netlify, etc.)

## Important Notes

- Variables must be prefixed with `VITE_` to be exposed to the browser
- After changing `.env`, restart the dev server (`npm run dev`)
- Never commit `.env` to version control (it's in `.gitignore`)
- Always commit `.env.example` as a template

