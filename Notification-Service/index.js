import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/Db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { startOutboxPublisher } from "./services/outboxPublisher.js";
import notificationRoutes from "./routes/notification.route.js";

dotenv.config();

const app = express();

app.use(express.json());

// Routes
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5002;

// Initialize Services & Start Server
const startServer = async () => {
  await connectDB();
  await connectRabbitMQ();
  startOutboxPublisher();

  app.listen(PORT, () => {
    console.log(`Notification Service running on port ${PORT}`);
  });
};

startServer();