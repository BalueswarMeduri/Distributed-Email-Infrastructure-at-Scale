import OutboxEvent from "../models/outbox.model.js";
import Notification from "../models/notification.model.js";
import { publishEventToRabbitMQ } from "../config/rabbitmq.js";

let isPublisherRunning = false;

export const startOutboxPublisher = () => {
  console.log("🚀 Outbox Publisher started! Polling every 5 seconds...");
  
  setInterval(async () => {
    if (isPublisherRunning) return; // Prevent concurrent executions if previous run is still processing
    isPublisherRunning = true;

    try {
      // Find pending outbox events where scheduledAt is within 30 seconds from now (or past due)
      const thresholdTime = new Date(Date.now() + 30 * 1000);

      const pendingEvents = await OutboxEvent.find({
        status: "PENDING",
        scheduledAt: { $lte: thresholdTime }
      }).limit(50); // Batch process to prevent memory overload

      if (pendingEvents.length > 0) {
        console.log(`[Outbox Publisher] Found ${pendingEvents.length} pending events ready to publish.`);
      }

      for (const event of pendingEvents) {
        try {
          const payload = {
            eventId: event._id,
            notificationId: event.notificationId,
            campaignId: event.campaignId
          };

          // 1. Publish to RabbitMQ
          await publishEventToRabbitMQ(payload);

          // 2. Mark Outbox Event as PUBLISHED
          event.status = "PUBLISHED";
          event.publishedAt = new Date();
          await event.save();

          // 3. Update Notification status to QUEUED
          await Notification.findByIdAndUpdate(event.notificationId, {
            status: "QUEUED"
          });

          console.log(`[Outbox Publisher] Event ${event._id} published for notification ${event.notificationId}`);
        } catch (err) {
          console.error(`[Outbox Publisher] Error publishing event ${event._id}:`, err.message);
        }
      }
    } catch (error) {
      console.error("[Outbox Publisher] Polling error:", error.message);
    } finally {
      isPublisherRunning = false;
    }
  }, 5000);
};
