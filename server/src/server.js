require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const aiRoutes = require('./routes/aiRoutes');
const adminRoutes = require('./routes/adminRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const loyaltyRoutes = require('./routes/loyaltyRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io for live updates
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`📡 [Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    // console.log(`📡 [Socket.IO] Client disconnected: ${socket.id}`);
  });
});

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cache-Control', 'Pragma', 'Expires'],
  })
);

app.use(express.json());
app.use(morgan('dev'));

// Attach io to req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Love & Co. Apothecary API Gateway',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes on both /api/v1 and /api for full spec compliance
const mountAppRoutes = (prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/products`, productRoutes);
  app.use(`${prefix}/cart`, cartRoutes);
  app.use(`${prefix}/orders`, orderRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/webhooks`, webhookRoutes);
  app.use(`${prefix}/loyalty`, loyaltyRoutes);
  app.use(`${prefix}/wishlist`, wishlistRoutes);
};

mountAppRoutes('/api/v1');
mountAppRoutes('/api');

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 [Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Apothecary Gateway Error',
  });
});

const PORT = parseInt(process.env.PORT, 10) || 5000;
let listenAttempts = 0;
const MAX_ATTEMPTS = 10;

function startServer(port) {
  try {
    server.removeAllListeners('listening');
    server.listen(port, () => {
      listenAttempts = 0;
      console.log(`
╔══════════════════════════════════════════════════════════════════╗
║               LOVE & CO. — BOTANICAL APOTHECARY                  ║
║         Clinical Formulation & Multi-Agent Routine Engine        ║
╚══════════════════════════════════════════════════════════════════╝
📡 API Server running on port: http://localhost:${port}
⚡ Health check: http://localhost:${port}/health
🌱 Initial catalog and demo credentials initialized
`);
    });
  } catch (err) {
    // Handled by server.on('error')
  }
}

// Handle port conflicts and release lag smoothly without crashing node --watch
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    listenAttempts++;
    if (listenAttempts <= MAX_ATTEMPTS) {
      console.warn(`⏳ [Server] Port ${PORT} busy (waiting for socket release, attempt ${listenAttempts}/${MAX_ATTEMPTS}). Retrying in 1.2s...`);
      setTimeout(() => {
        try {
          server.close();
        } catch (_) {}
        startServer(PORT);
      }, 1200);
    } else {
      console.error(`❌ [Server] Port ${PORT} remained busy after ${MAX_ATTEMPTS} attempts.`);
    }
  } else {
    console.error('💥 [Server Listen Error]:', err);
  }
});

// Graceful shutdown on process exit or watcher reload
const gracefulShutdown = () => {
  try {
    server.close(() => {
      process.exit(0);
    });
  } catch (_) {
    process.exit(0);
  }
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

async function bootstrap() {
  startServer(PORT);

  // Initialize DB asynchronously so HTTP gateway responds immediately
  connectDB().catch((err) => {
    console.warn('⚠️ [DB] Non-fatal database initialization notice:', err.message);
  });
}

bootstrap();
