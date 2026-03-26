const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Event orders (legacy): /api/event-orders/* → http://62.72.12.51:8080/api/event-orders/*
  // Needed for event cancel flow endpoints like /api/event-orders/{id}/cancel
  app.use(
    '/api/event-orders',
    createProxyMiddleware({
      target: 'http://69.62.77.33:8080',   //url of the backend server
      changeOrigin: true,   //url of the backend server
      secure: false,
      pathRewrite: (path) => `/api/event-orders${path}`,
      logLevel: 'debug',
      proxyTimeout: 60000,
      timeout: 60000,
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy Event Orders]', req.method, req.url, '->', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('[Proxy Event Orders Response]', req.url, '->', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Event Orders Error]', err.message);
        res.status(500).send('Proxy error: ' + err.message);
      }
    })
  );

  // Event order details: /api/orders/*/event-details → http://62.72.12.51:8080/api/orders/*/event-details
  app.use(
    '/api/orders',
    createProxyMiddleware({
      target: 'http://69.62.77.33:8080/',
      target: 'http://69.62.77.33:8080/',
      changeOrigin: true,
      secure: false,
      // Only proxy requests that end with /event-details
      pathFilter: (path) => path.includes('/event-details'),
      pathRewrite: (path) => `/api/orders${path}`,
      logLevel: 'debug',
      proxyTimeout: 60000,
      timeout: 60000,
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy Event Order Details]', req.method, req.url, '->', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('[Proxy Event Order Details Response]', req.url, '->', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Event Order Details Error]', err.message);
        res.status(500).send('Proxy error: ' + err.message);
      }
    })
  );

  // Event order creation: /api/orders/event → http://62.72.12.51:8080/api/orders/event
  app.use(
    '/api/orders/event',
    createProxyMiddleware({
      target: 'http://69.62.77.33:8080/',
      target: 'http://69.62.77.33:8080/',
      changeOrigin: true,
      secure: false,
      pathRewrite: (path) => `/api/orders/event`,
      logLevel: 'debug',
      proxyTimeout: 60000,
      timeout: 60000,
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy Event Order Create]', req.method, req.url, '->', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('[Proxy Event Order Create Response]', req.url, '->', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Event Order Create Error]', err.message);
        res.status(500).send('Proxy error: ' + err.message);
      }
    })
  );

  // Event details: /api/events/* → http://62.72.12.51:8080/api/events/* (must be before /api)
  app.use(
    '/api/events',
    createProxyMiddleware({
      target: 'http://69.62.77.33:8080/',
      target: 'http://69.62.77.33:8080/',
      changeOrigin: true,
      secure: false,
      // When mounting a proxy on '/api/events', http-proxy-middleware forwards only
      // the remaining path (e.g. '/7/public'). The backend expects '/api/events/7/public'.
      pathRewrite: (path) => `/api/events${path}`,
      logLevel: 'debug',
      proxyTimeout: 60000,
      timeout: 60000,
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy Events]', req.method, req.url, '->', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('[Proxy Events Response]', req.url, '->', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Events Error]', err.message);
        res.status(500).send('Proxy error: ' + err.message);
      }
    })
  );

  // Lead details: /api/leads/* → http://69.62.77.33:8080/leads/*
  app.use(
    '/api/leads',
    createProxyMiddleware({
      target: 'http://69.62.77.33:8080/',
      changeOrigin: true,
      secure: false,
      pathRewrite: (path) => `/leads${path}`,
      logLevel: 'debug',
      proxyTimeout: 60000,
      timeout: 60000,
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy Leads]', req.method, req.url, '->', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('[Proxy Leads Response]', req.url, '->', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Leads Error]', err.message);
        res.status(500).send('Proxy error: ' + err.message);
      }
    })
  );

  // All other /api → http://62.72.12.51:6000/
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://69.62.77.33:8080/',
      target: 'http://69.62.77.33:8080/',
      changeOrigin: true,
      secure: false,
      pathRewrite: (path, req) => `/api${path}`,
      logLevel: 'debug',
      proxyTimeout: 60000,
      timeout: 60000,
      onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy]', req.method, req.url, '->', proxyReq.path);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('[Proxy Response]', req.url, '->', proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error('[Proxy Error]', err.message);
        res.status(500).send('Proxy error: ' + err.message);
      }
    })
  );
};

