import amqp from "amqplib";
import Notification from "../models/notification.model.js";
import Campaign from "../models/campaign.model.js";
import Failure from "../models/failure.model.js";

const DLQ_QUEUE = "email_notification_dlq";

let isMonitorRunning = false;

export const startDLQMonitor = () => {
  console.log("🔍 DLQ Monitor started! Polling Dead Letter Queue every 30 seconds...");

  setInterval(async () => {
    if (isMonitorRunning) return;
    isMonitorRunning = true;

    let connection = null;
    let channel = null;

    try {
      const rabbitUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672";
      connection = await amqp.connect(rabbitUrl);
      channel = await connection.createChannel();

      await channel.assertQueue(DLQ_QUEUE, { durable: true });

      // Check how many messages exist in DLQ
      const queueInfo = await channel.checkQueue(DLQ_QUEUE);
      if (queueInfo.messageCount === 0) {
        return;
      }

      console.log(`[DLQ Monitor] Found ${queueInfo.messageCount} failed messages in DLQ. Processing...`);

      // Process messages from DLQ using get() non-blocking
      let msg;
      while ((msg = await channel.get(DLQ_QUEUE, { noAck: false })) !== false) {
        try {
          const content = JSON.parse(msg.content.toString());
          const { notificationId, campaignId } = content;

          if (notificationId) {
            // 1. Update Notification status to FAILED
            await Notification.findByIdAndUpdate(notificationId, {
              status: "FAILED"
            });

            // 2. Create record in failures collection
            await Failure.create({
              notificationId,
              campaignId: campaignId || null,
              reason: "Email delivery failed after max retries (5 attempts)",
              attempts: 5,
              status: "FAILED"
            });

            console.log(`❌ [DLQ Monitor] Recorded permanent failure for notification ${notificationId}`);
          }

          // 3. Acknowledge DLQ message so it's removed from DLQ
          channel.ack(msg);
        } catch (err) {
          console.error("[DLQ Monitor] Error processing DLQ message:", err.message);
          channel.ack(msg); // Ack to prevent looping broken JSON
        }
      }
    } catch (error) {
      console.error("[DLQ Monitor] Error polling DLQ:", error.message);
    } finally {
      if (channel) await channel.close().catch(() => {});
      if (connection) await connection.close().catch(() => {});
      isMonitorRunning = false;
    }
  }, 30000);
};
