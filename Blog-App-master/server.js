const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
// Load env from .env and then override with config.env if present
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, 'config.env'), override: true });

const app = express();
const PORT = process.env.PORT || 3000;
let isMongoConnected = false;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from UI directory
app.use(express.static(path.join(__dirname, 'UI')));

// MongoDB connection
// Build MongoDB URI with safe encoding if parts are provided
function buildMongoUriFromParts() {
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const host = process.env.MONGODB_HOST; // e.g., cluster0.abcd.mongodb.net
  const dbName = process.env.MONGODB_DB || 'blogapp';
  const appName = process.env.MONGODB_APPNAME || 'Cluster0';
  if (username && password && host) {
    const encodedPassword = encodeURIComponent(password);
    return `mongodb+srv://${username}:${encodedPassword}@${host}/${dbName}?retryWrites=true&w=majority&appName=${appName}`;
  }
  return null;
}

const MONGODB_URI = process.env.MONGODB_URI || buildMongoUriFromParts() || 'mongodb://localhost:27017/blogapp';

function connectWithRetry(retryMs = 5000) {
  mongoose
    .connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    })
    .then(() => {
      isMongoConnected = true;
      console.log('✅ Connected to MongoDB');
    })
    .catch((error) => {
      isMongoConnected = false;
      console.error('❌ MongoDB connection error:', error);
      if (error.name === 'MongoParseError') {
        console.error(
          'ℹ️ Hint: If your password contains special characters like @, :, /, or #, URL-encode them (e.g., @ -> %40) in MONGODB_URI.'
        );
      }
      if (String(error.message || '').includes('whitelist') || String(error.message || '').includes('IP')) {
        console.error('🔐 Action required: Add your current IP in MongoDB Atlas → Network Access (or allow 0.0.0.0/0 temporarily).');
      }
      console.log(`⏳ Retrying MongoDB connection in ${retryMs / 1000}s...`);
      setTimeout(() => connectWithRetry(Math.min(retryMs * 2, 60000)), retryMs);
    });
}

connectWithRetry();

// Blog Post Schema
const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  url: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid HTTP/HTTPS link'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
blogPostSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);

// Routes

// Get all blog posts
app.get('/api/blogposts', async (req, res) => {
  if (!isMongoConnected) {
    return res.status(503).json({ message: 'Database not connected yet. Please try again shortly.' });
  }
  try {
    const posts = await BlogPost.find()
      .sort({ createdAt: -1 })
      .limit(50); // Limit to 50 posts for performance
    
    res.json({
      posts: posts,
      count: posts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      message: 'Error retrieving posts: ' + error.message
    });
  }
});

// Create a new blog post
app.post('/api/blogposts', async (req, res) => {
  if (!isMongoConnected) {
    return res.status(503).json({ message: 'Database not connected yet. Please try again shortly.' });
  }
  try {
    const { title, content, url } = req.body;
    
    // Validate input
    if (!title || !content) {
      return res.status(400).json({
        message: 'Title and content are required'
      });
    }
    
    if (title.length > 200) {
      return res.status(400).json({
        message: 'Title too long. Maximum 200 characters allowed.'
      });
    }
    
    if (content.length > 10000) {
      return res.status(400).json({
        message: 'Content too long. Maximum 10,000 characters allowed.'
      });
    }
    
    const newPost = new BlogPost({
      title: title.trim(),
      content: content.trim(),
      url: url ? url.trim() : undefined
    });
    
    const savedPost = await newPost.save();
    
    res.status(201).json({
      message: 'Post created successfully',
      postId: savedPost._id,
      post: savedPost
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      message: 'Error creating post: ' + error.message
    });
  }
});

// Delete a blog post
app.delete('/api/blogposts', async (req, res) => {
  if (!isMongoConnected) {
    return res.status(503).json({ message: 'Database not connected yet. Please try again shortly.' });
  }
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return res.status(400).json({
        message: 'Post ID is required'
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        message: 'Invalid Post ID format'
      });
    }
    
    const deletedPost = await BlogPost.findByIdAndDelete(postId);
    
    if (!deletedPost) {
      return res.status(404).json({
        message: 'Post not found'
      });
    }
    
    res.json({
      message: 'Post deleted successfully',
      postId: postId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({
      message: 'Error deleting post: ' + error.message
    });
  }
});

// Get a single blog post by ID
app.get('/api/blogposts/:id', async (req, res) => {
  if (!isMongoConnected) {
    return res.status(503).json({ message: 'Database not connected yet. Please try again shortly.' });
  }
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid Post ID format'
      });
    }
    
    const post = await BlogPost.findById(id);
    
    if (!post) {
      return res.status(404).json({
        message: 'Post not found'
      });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      message: 'Error retrieving post: ' + error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'UI', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    message: 'Internal server error: ' + error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Blog API available at http://localhost:${PORT}/api/blogposts`);
  console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});
