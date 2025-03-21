/**
 * Debug middleware collection
 * Contains various debug middlewares to help troubleshoot issues
 */

/**
 * Middleware that logs detailed information about authentication
 * Useful for debugging auth-related issues
 */
const debugAuth = (req, res, next) => {
  console.log('🔒 Auth Debug:', {
    path: req.path,
    method: req.method,
    isAuthenticated: !!req.user,
    userId: req.user?.id,
    userRole: req.user?.role,
    headers: {
      authorization: req.headers.authorization ? 
        `${req.headers.authorization.slice(0, 15)}...` : 
        'none'
    }
  });
  next();
};

/**
 * Middleware that logs detailed request information
 * Useful for debugging request/response issues
 */
const debugRequest = (req, res, next) => {
  const startTime = Date.now();
  
  console.log('📝 Request Debug ➡️:', {
    path: req.originalUrl,
    method: req.method,
    query: req.query,
    body: req.body,
    headers: req.headers,
    ip: req.ip
  });
  
  // Store the original send function
  const originalSend = res.send;
  
  // Override the send function to log response
  res.send = function(body) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('📝 Response Debug ⬅️:', {
      path: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: body ? body.length : 0,
      isJSON: typeof body === 'string' && body.startsWith('{')
    });
    
    // Call the original send function
    return originalSend.call(this, body);
  };
  
  next();
};

module.exports = {
  debugAuth,
  debugRequest
};