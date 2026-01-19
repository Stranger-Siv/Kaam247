#!/bin/bash

echo "🚀 Setting up Kaam247 for local development..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v18 or higher."
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Check MongoDB (optional - can use Atlas)
if command -v mongod &> /dev/null; then
    echo "✅ MongoDB found locally"
else
    echo "⚠️  MongoDB not found locally. You can use MongoDB Atlas instead."
fi

echo ""
echo "📦 Installing dependencies..."

# Install server dependencies
echo "Installing server dependencies..."
cd server
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Server dependencies already installed"
fi

# Install client dependencies
echo "Installing client dependencies..."
cd ../client
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Client dependencies already installed"
fi

cd ..

echo ""
echo "⚙️  Setting up environment variables..."

# Create server .env if it doesn't exist
if [ ! -f "server/.env" ]; then
    if [ -f "server/.env.example" ]; then
        cp server/.env.example server/.env
        echo "✅ Created server/.env from .env.example"
        echo "⚠️  Please edit server/.env and add your MongoDB connection string"
    else
        echo "⚠️  server/.env.example not found. Creating default .env..."
        cat > server/.env << 'ENVEOF'
PORT=3001
MONGO_URI=mongodb://localhost:27017/kaam247
JWT_SECRET=dev-secret-key-change-in-production
ENVEOF
        echo "✅ Created server/.env with default values"
    fi
else
    echo "✅ server/.env already exists"
fi

# Client .env.local is optional
if [ ! -f "client/.env.local" ]; then
    echo "✅ Client will use default localhost URLs (no .env.local needed)"
else
    echo "✅ client/.env.local already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit server/.env and set your MONGO_URI"
echo "2. Start MongoDB (if using local): mongod or brew services start mongodb-community"
echo "3. Start server: cd server && npm run dev"
echo "4. Start client: cd client && npm run dev"
echo ""
echo "🌐 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
