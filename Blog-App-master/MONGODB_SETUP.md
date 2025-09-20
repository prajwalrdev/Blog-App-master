# 🚀 MongoDB Blog App Setup Guide

## 📋 Prerequisites

1. **Node.js** (version 14 or higher)
   - Download from: https://nodejs.org/
   - Or install via package manager

2. **MongoDB** (local or cloud)
   - **Option A: Local MongoDB**
     - Download from: https://www.mongodb.com/try/download/community
     - Or install via package manager
   - **Option B: MongoDB Atlas (Cloud)**
     - Free tier available at: https://www.mongodb.com/atlas
     - No local installation needed

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup MongoDB

#### Option A: Local MongoDB
1. **Install MongoDB Community Server**
   - Windows: Download MSI installer
   - Mac: `brew install mongodb-community`
   - Linux: Follow MongoDB installation guide

2. **Start MongoDB Service**
   ```bash
   # Windows (as Administrator)
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   # or
   mongod
   ```

#### Option B: MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster (free tier)
4. Get your connection string
5. Update `config.env` with your Atlas connection string

### Step 3: Configure Environment
```bash
# Copy the example config
cp config.env .env

# Edit .env file with your MongoDB connection string
# For local MongoDB (default):
MONGODB_URI=mongodb://localhost:27017/blogapp

# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blogapp?retryWrites=true&w=majority
```

### Step 4: Start the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### Step 5: Access the Application
- **Blog App**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api/blogposts
- **Health Check**: http://localhost:3000/api/health

## 🛠️ Available Scripts

```bash
# Install dependencies
npm install

# Start in development mode (with nodemon)
npm run dev

# Start in production mode
npm start

# Check if everything is working
curl http://localhost:3000/api/health
```

## 📊 API Endpoints

### GET /api/blogposts
- **Description**: Get all blog posts
- **Response**: Array of blog posts with pagination

### POST /api/blogposts
- **Description**: Create a new blog post
- **Body**: `{ "title": "string", "content": "string", "url": "string" }`
- **Response**: Created blog post with ID

### DELETE /api/blogposts
- **Description**: Delete a blog post
- **Body**: `{ "postId": "string" }`
- **Response**: Success message

### GET /api/blogposts/:id
- **Description**: Get a single blog post by ID
- **Response**: Blog post object

## 🔧 Configuration

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 3000)

### Database Schema
```javascript
{
  title: String (required, max 200 chars),
  content: String (required, max 10000 chars),
  url: String (optional, must be valid URL),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-updated)
}
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:27017
   ```
   **Solution**: Make sure MongoDB is running locally

2. **Port Already in Use**
   ```
   Error: listen EADDRINUSE :::3000
   ```
   **Solution**: Change PORT in config.env or kill the process using port 3000

3. **Module Not Found**
   ```
   Error: Cannot find module 'express'
   ```
   **Solution**: Run `npm install` to install dependencies

### Debug Steps

1. **Check MongoDB Status**
   ```bash
   # Local MongoDB
   mongosh --eval "db.adminCommand('ismaster')"
   
   # Or check if service is running
   # Windows: services.msc
   # Mac/Linux: systemctl status mongod
   ```

2. **Test API Endpoints**
   ```bash
   # Health check
   curl http://localhost:3000/api/health
   
   # Get all posts
   curl http://localhost:3000/api/blogposts
   ```

3. **Check Logs**
   - Server logs will show in the terminal
   - MongoDB logs: Check MongoDB log files

## 💰 Cost Comparison

### MongoDB vs AWS
- **MongoDB Local**: $0 (completely free)
- **MongoDB Atlas Free Tier**: $0 (512MB storage, shared clusters)
- **AWS Free Tier**: $0 (but complex setup, limited time)

### Benefits of MongoDB Version
- ✅ **Simpler Setup**: No AWS account needed
- ✅ **Local Development**: Run completely offline
- ✅ **No Time Limits**: Free tier doesn't expire
- ✅ **Easy Deployment**: Deploy to any hosting service
- ✅ **Better for Learning**: Easier to understand and modify

## 🚀 Deployment Options

### 1. Local Development
- Run `npm run dev` for development
- Access at http://localhost:3000

### 2. Cloud Deployment
- **Heroku**: Easy deployment with MongoDB Atlas
- **Railway**: Simple Node.js deployment
- **Vercel**: Serverless deployment
- **DigitalOcean**: VPS deployment

### 3. Docker Deployment
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 📚 Next Steps

1. **Add Authentication**: Implement user login/signup
2. **Add Categories**: Organize posts by categories
3. **Add Comments**: Allow users to comment on posts
4. **Add Search**: Search functionality for posts
5. **Add Images**: Upload and display images
6. **Add Admin Panel**: Admin interface for managing posts

## 🆘 Support

- Check the console logs for error messages
- Verify MongoDB connection string
- Ensure all dependencies are installed
- Test API endpoints individually
