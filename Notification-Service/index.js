import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/Db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startOutboxPublisher } from "./services/outboxPublisher.js";
import client from "@prometheus-io/client";
import logger from "./utils/logger.js";
import notificationRoutes from "./routes/notification.route.js";

dotenv.config();

const app = express();

app.use(express.json());

// Loki HTTP Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path !== "/metrics") {
      logger.info(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${Date.now() - start}ms`, {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Date.now() - start
      });
    }
  });
  next();
});

// Initialize Prometheus Default Metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Prometheus Metrics Endpoint
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  return res.end(metrics);
});

// Routes for both gateway-proxied and direct calls
app.use("/api/notifications", notificationRoutes);
app.use("/", notificationRoutes);

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();
  startOutboxPublisher();

  app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
  });
};

startServer();