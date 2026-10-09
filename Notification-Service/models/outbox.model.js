import mongoose from "mongoose";

const OutboxEventSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      required: true,
      index: true
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
      index: true
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ["PENDING", "PUBLISHED"],
      default: "PENDING",
      index: true
    },
    publishedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const OutboxEvent = mongoose.model("OutboxEvent", OutboxEventSchema);
export default OutboxEvent;
