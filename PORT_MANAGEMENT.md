# Port Management Guide for Kaam247

## How to Check What's Running on a Port

### Check a Specific Port
```bash
# Check port 3001 (backend)
lsof -i :3001

# Check port 5173 (frontend/Vite)
lsof -i :5173

# Check any port
lsof -i :PORT_NUMBER
```

### Get Just the Process ID (PID)
```bash
# Get PID for port 3001
lsof -ti:3001

# Get PID for port 5173
lsof -ti:5173
```

### See All Processes Using Ports
```bash
# List all processes using network ports
lsof -i -P -n | grep LISTEN

# Or more detailed
netstat -anv | grep LISTEN
```

## How to Stop Processes on Ports

### Method 1: Kill by Port (Recommended)
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Kill process on any port (replace PORT with actual port)
lsof -ti:PORT | xargs kill -9
```

### Method 2: Kill by PID
```bash
# First, find the PID
lsof -ti:3001

# Then kill it (replace PID with actual process ID)
kill -9 PID

# Or force kill
kill -9 PID
```

### Method 3: One-liner to Kill Multiple Ports
```bash
# Kill both backend and frontend ports
lsof -ti:3001 | xargs kill -9 && lsof -ti:5173 | xargs kill -9
```

## Common Kaam247 Ports

- **3001**: Backend server (Express.js)
- **5173**: Frontend dev server (Vite)
- **5000, 5001, 5002**: Alternative backend ports (if changed)

## Quick Commands for Kaam247

### Check Kaam247 Ports
```bash
echo "Backend (3001):" && lsof -ti:3001 && echo "Frontend (5173):" && lsof -ti:5173
```

### Stop All Kaam247 Processes
```bash
# Stop backend
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Stop frontend
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Stop both
lsof -ti:3001 | xargs kill -9 2>/dev/null && lsof -ti:5173 | xargs kill -9 2>/dev/null
```

### Find and Kill by Process Name
```bash
# Find node processes
ps aux | grep node

# Kill all node processes (be careful!)
pkill -9 node

# Kill specific node process by name
pkill -9 -f "nodemon"
pkill -9 -f "vite"
```

## Understanding the Commands

- `lsof`: List Open Files (shows what's using ports)
- `-i`: Internet addresses
- `-P`: Don't resolve port names (show numbers)
- `-n`: Don't resolve hostnames
- `-t`: Show only PIDs (process IDs)
- `kill -9`: Force kill a process (SIGKILL signal)
- `xargs`: Pass output as arguments to next command

## Troubleshooting

### Port Still in Use After Kill
```bash
# Wait a moment, then check again
sleep 2 && lsof -i :3001

# If still running, try with sudo (be careful!)
sudo lsof -ti:3001 | xargs kill -9
```

### Permission Denied
```bash
# Use sudo (enter your password)
sudo lsof -ti:3001 | xargs kill -9
```

### Find What's Using a Port (Detailed)
```bash
# See full details
lsof -i :3001

# Output shows:
# COMMAND  PID  USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# node    1234  user   23u  IPv4  ...      0t0  TCP *:3001 (LISTEN)
```

