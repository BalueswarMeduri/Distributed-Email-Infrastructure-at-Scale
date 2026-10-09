import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/Db.js";
import initRedis from "./config/redis.js";
import { initEmailTransporter } from "./services/emailService.js";
import { startWorkerConsumer } from "./services/workerConsumer.js";
import { startDLQMonitor } from "./services/dlqMonitor.js";

dotenv.config();

const app = express();
app.use(express.json());

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "Worker-Service" });
});

const PORT = process.env.PORT || 5003;

const startServer = async () => {
  console.log("⚙️ Starting Worker Service...");

  // 1. Connect DB
  await connectDB();

  // 2. Initialize Redis Rate Limiter
  initRedis();

  // 3. Initialize Email Transporter
  await initEmailTransporter();

  // 4. Start Worker Consumer for RabbitMQ
  await startWorkerConsumer();

  // 5. Start DLQ Monitoring (30s interval)
  startDLQMonitor();

  app.listen(PORT, () => {
    console.log(`🚀 Worker Service running on port ${PORT}`);
  });
};

startServer();
