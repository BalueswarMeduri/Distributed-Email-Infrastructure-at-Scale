import mongoose from "mongoose";

const FailureSchema = new mongoose.Schema(
  {
    notificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Notification",
      default: null,
      index: true
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
      index: true
    },
    reason: {
      type: String,
      required: true
    },
    attempts: {
      type: Number,
      default: 5
    },
    status: {
      type: String,
      default: "FAILED"
    },
    failedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const Failure = mongoose.model("Failure", FailureSchema);
export default Failure;
