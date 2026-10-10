import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import ConnectDB from './Config/DB.js';
import cors from 'cors';
import AuthRoute from './routes/auth.route.js';
import client from '@prometheus-io/client';
import logger from './utils/logger.js';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: true,
    credentials: true
}));

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

const collectDefaultMetrics = client.collectDefaultMetrics;

collectDefaultMetrics({ register: client.register })


app.get("/metrics", async (req,res) => {
    res.setHeader("Content-Type", client.register.contentType)
    const metrics = await client.register.metrics();
    return res.end(metrics);
})

// Route handler for both gateway-proxied and direct routes
app.use("/api/auth", AuthRoute);
app.use("/", AuthRoute);

const PORT = process.env.PORT || 5001;

ConnectDB();

app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});