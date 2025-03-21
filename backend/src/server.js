const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');
const mongoSanitize = require('express-mongo-sanitize');
const os = require('os');

const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './.env' });

// Connect to database
connectDB();

// Route files
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const hostRoutes = require('./routes/host.routes');
const cleanerRoutes = require('./routes/cleaner.routes');
const listingRoutes = require('./routes/listing.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const notificationRoutes = require('./routes/notification.routes');
const messageRoutes = require('./routes/message.routes');
const invoiceRoutes = require('./routes/invoice.routes');

const app = express();

// Body parser with increased limit for larger payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser
app.use(cookieParser());

// File uploading
app.use(fileUpload());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sanitize data
app.use(mongoSanitize());

// Set security headers with relaxed settings for development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 1000 // Increased limit for development
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enhanced CORS configuration to ensure mobile apps can connect
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Additional CORS preflight handler for problematic clients
app.options('*', cors());

// Log all incoming requests in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl} from ${req.ip}`, req.body);
    next();
  });
}

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/hosts', hostRoutes);
app.use('/api/v1/cleaners', cleanerRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1', messageRoutes); // This has multiple roots (/conversations, /messages)
app.use('/api/v1/invoices', invoiceRoutes);

// Test route to verify API is working
app.get('/api/v1/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working correctly', 
    client: req.headers['user-agent'],
    clientIp: req.ip,
    timestamp: new Date().toISOString()
  });
});

// Additional debug route to help troubleshoot connection issues
app.get('/api/v1/debug', (req, res) => {
  // Get all network interfaces
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  
  // Extract all IP addresses
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      // Skip internal/non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          address: iface.address,
          interface: interfaceName
        });
      }
    });
  });

  res.json({ 
    status: 'up', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    clientInfo: {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      headers: req.headers
    },
    serverInfo: {
      hostname: os.hostname(),
      platform: os.platform(),
      networkInterfaces: addresses,
      apiPort: PORT
    }
  });
});

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'up', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    clientIp: req.ip
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
// Explicitly binding to 0.0.0.0 (all network interfaces) to ensure Android devices can connect
const HOST = '0.0.0.0';

// Get local IP addresses to display in console
const getLocalIpAddresses = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  Object.keys(interfaces).forEach((interfaceName) => {
    interfaces[interfaceName].forEach((iface) => {
      // Skip over internal (i.e. 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    });
  });
  
  return addresses;
};

const server = app.listen(
  PORT,
  HOST,
  () => {
    const localIps = getLocalIpAddresses();
    
    console.log(
      `Server running in ${process.env.NODE_ENV} mode on ${HOST}:${PORT}`.yellow.bold
    );
    console.log(`API accessible at http://localhost:${PORT}/api/v1 (locally)`);
    console.log(`For Android emulator, use: http://10.0.2.2:${PORT}/api/v1`);
    
    console.log('\nFor real Android devices, use one of these URLs:'.green);
    localIps.forEach(ip => {
      console.log(`http://${ip}:${PORT}/api/v1`.cyan);
    });
    
    console.log('\nTest API connectivity with:'.green);
    console.log(`http://localhost:${PORT}/api/v1/test (Web)`.cyan);
    console.log(`http://10.0.2.2:${PORT}/api/v1/test (Android Emulator)`.cyan);
    localIps.forEach(ip => {
      console.log(`http://${ip}:${PORT}/api/v1/test (Android Device)`.cyan);
    });
    
    console.log('\nDebug connection issues with:'.green);
    console.log(`http://localhost:${PORT}/api/v1/debug`.cyan);
    
    console.log('\nServer bound to all network interfaces (0.0.0.0) to allow connections from all devices'.yellow);
  }
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = server;