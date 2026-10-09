import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    total: {
      type: Number,
      default: 0
    },
    scheduledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "SCHEDULED"
    }
  },
  { timestamps: true }
);

const Campaign = mongoose.model("Campaign", CampaignSchema);
export default Campaign;
