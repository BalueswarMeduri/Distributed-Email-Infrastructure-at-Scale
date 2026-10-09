import amqp from "amqplib";
import Notification from "../models/notification.model.js";
import Campaign from "../models/campaign.model.js";
import IdempotencyRecord from "../models/idempotency.model.js";
import Failure from "../models/failure.model.js";
import { sendEmail } from "./emailService.js";
import { checkRateLimit } from "../config/redis.js";

const MAIN_QUEUE = "email_notification_queue";
const DLX_EXCHANGE = "email_notification_dlx";
const DLQ_QUEUE = "email_notification_dlq";
const MAX_RETRIES = 5;

let channel = null;

export const startWorkerConsumer = async () => {
  try {
    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
    const connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();

    // Set prefetch to process messages asynchronously with backpressure
    await channel.prefetch(10);

    // 1. Assert Dead Letter Exchange & DLQ
    await channel.assertExchange(DLX_EXCHANGE, "direct", { durable: true });
    await channel.assertQueue(DLQ_QUEUE, { durable: true });
    await channel.bindQueue(DLQ_QUEUE, DLX_EXCHANGE, DLQ_QUEUE);

    // 2. Assert Main Queue with Dead Letter routing
    await channel.assertQueue(MAIN_QUEUE, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": DLX_EXCHANGE,
        "x-dead-letter-routing-key": DLQ_QUEUE
      }
    });

    console.log(`📥 Worker Consumer listening on queue '${MAIN_QUEUE}' (DLQ configured)...`);

    // 3. Consume messages
    channel.consume(MAIN_QUEUE, async (msg) => {
      if (!msg) return;

      let content;
      try {
        content = JSON.parse(msg.content.toString());
      } catch (err) {
        console.error("Invalid JSON message in queue, sending to DLQ:", err.message);
        return channel.nack(msg, false, false); // Reject to DLQ
      }

      const { eventId, notificationId, campaignId } = content;

      try {
        // --- 1. Idempotency Check ---
        const existingIdempotency = await IdempotencyRecord.findOne({ key: eventId });
        if (existingIdempotency) {
          console.log(`[Worker] Skipping duplicate eventId: ${eventId}`);
          return channel.ack(msg);
        }

        const notification = await Notification.findById(notificationId);
        if (!notification) {
          console.warn(`[Worker] Notification ${notificationId} not found, moving to DLQ.`);
          return channel.nack(msg, false, false);
        }

        if (notification.status === "SUCCESS") {
          console.log(`[Worker] Notification ${notificationId} already delivered. Skipping.`);
          return channel.ack(msg);
        }

        // --- 2. Distributed Rate Limiting Check (30 emails / 10s) ---
        const allowed = await checkRateLimit();
        if (!allowed) {
          console.log(`[Worker] Rate limit reached (30 emails/10s). Re-queueing message...`);
          // Re-queue message after a short 1 second pause
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return channel.nack(msg, false, true);
        }

        // --- 3. Mark Notification as PROCESSING ---
        notification.status = "PROCESSING";
        await notification.save();

        if (campaignId) {
          await Campaign.findByIdAndUpdate(campaignId, { status: "PROCESSING" });
        }

        // --- 4. Attempt Email Sending ---
        // Extract retry count from headers or default to 1
        const deathHeader = msg.properties.headers["x-death"];
        let retryCount = 1;
        if (deathHeader && deathHeader.length > 0) {
          retryCount = deathHeader[0].count + 1;
        }

        await sendEmail({
          to: notification.to,
          from: notification.from,
          subject: notification.subject,
          body: notification.body
        });

        // --- 5. Mark as SUCCESS & Record Idempotency ---
        notification.status = "SUCCESS";
        await notification.save();

        await IdempotencyRecord.create({
          key: eventId,
          response: { notificationId, status: "SUCCESS" }
        });

        // Check if all campaign notifications are completed
        if (campaignId) {
          const pendingCount = await Notification.countDocuments({
            campaignId,
            status: { $in: ["SCHEDULED", "PENDING", "QUEUED", "PROCESSING"] }
          });
          if (pendingCount === 0) {
            await Campaign.findByIdAndUpdate(campaignId, { status: "COMPLETED" });
            console.log(`🎉 Campaign ${campaignId} set to COMPLETED!`);
          }
        }

        console.log(`✅ [Worker] Successfully processed notification ${notificationId}`);
        channel.ack(msg);

      } catch (error) {
        console.error(`❌ [Worker] Error processing notification ${notificationId}:`, error.message);

        // Check retry count
        const deathHeader = msg.properties.headers["x-death"];
        let retryCount = 1;
        if (deathHeader && deathHeader.length > 0) {
          retryCount = deathHeader[0].count + 1;
        }

        if (retryCount >= MAX_RETRIES) {
          console.error(`🚨 [Worker] Max retries (${MAX_RETRIES}) exhausted for notification ${notificationId}. Moving to DLQ.`);
          // Reject without requeue -> sends to DLQ
          channel.nack(msg, false, false);
        } else {
          console.warn(`⚠️ [Worker] Retrying notification ${notificationId} (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
          // Delay retry by 2 seconds
          await new Promise((resolve) => setTimeout(resolve, 2000));
          // Requeue message
          channel.nack(msg, false, true);
        }
      }
    });

  } catch (error) {
    console.error("Worker Consumer startup error:", error.message);
    setTimeout(startWorkerConsumer, 5000);
  }
};
