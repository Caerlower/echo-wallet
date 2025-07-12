require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Import routes with error handling
let walletRoutes, chatRoutes, aiRoutes;

try {
  walletRoutes = require('./routes/wallet');
  console.log('✅ Wallet routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading wallet routes:', error.message);
  walletRoutes = express.Router();
}

try {
  chatRoutes = require('./routes/chat');
  console.log('✅ Chat routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading chat routes:', error.message);
  chatRoutes = express.Router();
}

try {
  aiRoutes = require('./routes/ai');
  console.log('✅ AI routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading AI routes:', error.message);
  aiRoutes = express.Router();
}

const noditProxyRoutes = require('./routes/nodit');

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/wallet', walletRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/nodit', noditProxyRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle wallet connection
  socket.on('wallet_connected', (data) => {
    console.log('Wallet connected:', data.address);
    socket.join(`wallet_${data.address}`);
    socket.emit('wallet_status', { 
      status: 'connected', 
      address: data.address,
      timestamp: new Date().toISOString()
    });
  });

  // Handle chat messages
  socket.on('send_message', async (data) => {
    try {
      // Emit typing indicator
      socket.emit('typing_start');
      
      // Process message (this will be handled by chat service)
      socket.emit('message_received', {
        id: Date.now(),
        type: 'user',
        content: data.message,
        timestamp: new Date().toISOString()
      });

      // TODO: Process with AI and emit response
      setTimeout(() => {
        socket.emit('typing_stop');
        socket.emit('message_received', {
          id: Date.now() + 1,
          type: 'assistant',
          content: 'Processing your request...',
          timestamp: new Date().toISOString()
        });
      }, 1000);

    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 EchoWallet WebApp Backend running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for real-time connections`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, io }; 