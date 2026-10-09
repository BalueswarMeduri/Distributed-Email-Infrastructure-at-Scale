import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null
    },
    userId: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    from: {
      type: String,
      required: true
    },
    subject: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    scheduledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "PENDING", "QUEUED", "PROCESSING", "SUCCESS", "FAILED"],
      default: "SCHEDULED"
    }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
