import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";
import { initRedisGateway, rateLimiter } from "./middleware/rateLimiter.middleware.js";
import { verifyAuth } from "./middleware/auth.middleware.js";

dotenv.config();

const app = express();

// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());

// Initialize Redis for Rate Limiting
initRedisGateway();

// Apply Rate Limiter to all requests
app.use(rateLimiter);

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "API-Gateway" });
});

// Proxy route: Auth Service (Port 5001)
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL || "http://localhost:5001",
    changeOrigin: true
  })
);

// Apply Auth Verification Middleware to protected routes below
app.use(verifyAuth);

// Proxy route: Notification Service (Port 5002)
app.use(
  "/api/notifications",
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5002",
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.user && req.user.id) {
          proxyReq.setHeader("x-user-id", req.user.id);
        }
      }
    }
  })
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🌐 API Gateway running on port ${PORT}`);
  console.log(`🔀 Routing /api/auth -> ${process.env.AUTH_SERVICE_URL || "http://localhost:5001"}`);
  console.log(`🔀 Routing /api/notifications -> ${process.env.NOTIFICATION_SERVICE_URL || "http://localhost:5002"}`);
});
