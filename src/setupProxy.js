const { createProxyMiddleware } = require('http-proxy-middleware');

const BACKEND = 'https://api.qa.littleknownplanet.com'
module.exports = function (app) {
  // Event orders (legacy): /api/event-orders/* → BACKEND/api/event-orders/*
  app.use(
    '/api/event-orders',
    createProxyMiddleware({
      target: BACKEND,
      changeOrigin: true,
      secure: true,
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

  // Event order details: /api/orders/*/event-details → BACKEND/api/orders/*/event-details
  app.use(
    '/api/orders',
    createProxyMiddleware({
      target: BACKEND,
      changeOrigin: true,
      secure: true,
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

  // Event order creation: /api/orders/event → BACKEND/api/orders/event
  app.use(
    '/api/orders/event',
    createProxyMiddleware({
      target: BACKEND,
      changeOrigin: true,
      secure: true,
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

  // Event details: /api/events/* → BACKEND/api/events/*
  app.use(
    '/api/events',
    createProxyMiddleware({
      target: BACKEND,
      changeOrigin: true,
      secure: true,
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

  // Lead details: /api/leads/* → BACKEND/leads/*
  app.use(
    '/api/leads',
    createProxyMiddleware({
      target: BACKEND,
      changeOrigin: true,
      secure: true,
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

  // All other /api → BACKEND
  app.use(
    '/api',
    createProxyMiddleware({
      target: BACKEND,
      changeOrigin: true,
      secure: true,
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
