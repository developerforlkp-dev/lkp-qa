const { createProxyMiddleware } = require("http-proxy-middleware");

const BACKEND_ORIGIN = "https://api.dev.littleknownplanet.com";

module.exports = function setupProxy(app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: BACKEND_ORIGIN,
      changeOrigin: true,
      secure: true,
      logLevel: "debug",
      proxyTimeout: 60000,
      timeout: 60000,
      onProxyReq: (proxyReq, req) => {
        console.log("[Proxy]", req.method, req.url, "->", proxyReq.path);
      },
      onProxyRes: (proxyRes, req) => {
        console.log("[Proxy Response]", req.url, "->", proxyRes.statusCode);
      },
      onError: (err, req, res) => {
        console.error("[Proxy Error]", err.message);
        res.status(500).send("Proxy error: " + err.message);
      },
    })
  );
};
