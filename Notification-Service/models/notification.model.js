import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    to: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    from: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
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
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "PENDING", "QUEUED", "PROCESSING", "SUCCESS", "FAILED"],
      default: "SCHEDULED",
      index: true
    }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);
export default Notification;
