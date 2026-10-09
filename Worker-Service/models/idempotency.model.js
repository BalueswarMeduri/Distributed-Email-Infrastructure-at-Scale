import mongoose from "mongoose";

const IdempotencyRecordSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    response: {
      type: Object,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400
    }
  }
);

const IdempotencyRecord = mongoose.model("IdempotencyRecord", IdempotencyRecordSchema);
export default IdempotencyRecord;
