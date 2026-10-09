import mongoose from "mongoose";
import Notification from "../models/notification.model.js";
import Campaign from "../models/campaign.model.js";
import OutboxEvent from "../models/outbox.model.js";
import Failure from "../models/failure.model.js";
import { processOutboxEvents } from "../services/outboxPublisher.js";

// Helper function to handle MongoDB transactions with graceful fallback if non-replica set
const executeTransaction = async (workFn) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    if (error.message && error.message.includes("Transaction numbers are only allowed on a replica set member")) {
      return await workFn(null);
    }
    throw error;
  }
};

// 1. Send Single Email
export const sendSingleEmail = async (req, res) => {
  try {
    const { userId, to, from, subject, body, scheduledAt } = req.body;

    if (!userId || !to || !from || !subject || !body) {
      return res.status(400).json({ message: "userId, to, from, subject, and body are required." });
    }

    // If no scheduledAt specified, set to current time minus 1 sec for instant outbox match
    const scheduleDate = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() - 1000);

    const result = await executeTransaction(async (session) => {
      const opts = session ? { session } : {};

      const notificationArray = await Notification.create(
        [
          {
            userId,
            to,
            from,
            subject,
            body,
            scheduledAt: scheduleDate,
            status: "SCHEDULED"
          }
        ],
        opts
      );

      const notification = notificationArray[0];

      const outboxArray = await OutboxEvent.create(
        [
          {
            notificationId: notification._id,
            scheduledAt: scheduleDate,
            status: "PENDING"
          }
        ],
        opts
      );

      return { notification, outboxEvent: outboxArray[0] };
    });

    // Instantly trigger outbox processing to push event to RabbitMQ without delay
    processOutboxEvents().catch((err) => console.error("Outbox instant trigger notice:", err.message));

    return res.status(201).json({
      message: "Notification created & outbox event recorded successfully",
      data: result
    });
  } catch (error) {
    console.error("Error in sendSingleEmail:", error);
    return res.status(500).json({ message: "Failed to create single email notification", error: error.message });
  }
};

// 2. Send Bulk Emails / Create Campaign
export const sendBulkEmails = async (req, res) => {
  try {
    const { userId, title, from, subject, body, recipients, scheduledAt } = req.body;

    if (!userId || !title || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "userId, title, and a non-empty recipients array are required." });
    }

    const scheduleDate = scheduledAt ? new Date(scheduledAt) : new Date(Date.now() - 1000);

    const result = await executeTransaction(async (session) => {
      const opts = session ? { session } : {};

      // Create Campaign
      const campaignArray = await Campaign.create(
        [
          {
            userId,
            title,
            total: recipients.length,
            scheduledAt: scheduleDate,
            status: "SCHEDULED"
          }
        ],
        opts
      );
      const campaign = campaignArray[0];

      // Prepare Notification & Outbox documents
      const notificationDocs = recipients.map((recipient) => {
        const recipientEmail = typeof recipient === "string" ? recipient : recipient.to;
        const recipientSubject = (typeof recipient === "object" && recipient.subject) ? recipient.subject : subject;
        const recipientBody = (typeof recipient === "object" && recipient.body) ? recipient.body : body;
        const recipientFrom = (typeof recipient === "object" && recipient.from) ? recipient.from : from;

        return {
          campaignId: campaign._id,
          userId,
          to: recipientEmail,
          from: recipientFrom,
          subject: recipientSubject,
          body: recipientBody,
          scheduledAt: scheduleDate,
          status: "SCHEDULED"
        };
      });

      const insertedNotifications = await Notification.insertMany(notificationDocs, opts);

      const outboxDocs = insertedNotifications.map((notif) => ({
        notificationId: notif._id,
        campaignId: campaign._id,
        scheduledAt: scheduleDate,
        status: "PENDING"
      }));

      await OutboxEvent.insertMany(outboxDocs, opts);

      return {
        campaign,
        totalNotifications: insertedNotifications.length
      };
    });

    // Instantly trigger outbox processing to push events to RabbitMQ without delay
    processOutboxEvents().catch((err) => console.error("Outbox instant trigger notice:", err.message));

    return res.status(201).json({
      message: "Bulk email campaign created successfully with outbox events",
      data: result
    });
  } catch (error) {
    console.error("Error in sendBulkEmails:", error);
    return res.status(500).json({ message: "Failed to create bulk email campaign", error: error.message });
  }
};

// 3. Get All Campaigns and Dashboard Stats for a User
export const getUserCampaigns = async (req, res) => {
  try {
    const { userId } = req.params;
    const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 });

    // Fetch exact MongoDB document counts for notifications & failures
    const totalNotifications = await Notification.countDocuments({ userId });
    const successfulDeliveries = await Notification.countDocuments({
      userId,
      status: { $in: ["SUCCESS", "COMPLETED", "PROCESSING", "SCHEDULED"] }
    });
    const failedDeliveries = await Notification.countDocuments({
      userId,
      status: "FAILED"
    });

    return res.status(200).json({
      campaigns,
      stats: {
        totalEmailsDispatched: totalNotifications,
        totalCampaigns: campaigns.length,
        successfulDeliveries,
        failedDeliveries
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching campaigns and stats", error: error.message });
  }
};

// 4. Get Campaign Status & Detailed Breakdown
export const getCampaignStatus = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const breakdown = await Notification.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const statusCounts = {};
    breakdown.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    return res.status(200).json({
      campaign,
      statusCounts
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching campaign status", error: error.message });
  }
};

// 5. Get Notification Details by ID
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    return res.status(200).json({ notification });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching notification", error: error.message });
  }
};

// 6. Cancel Campaign
export const cancelCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (campaign.status === "COMPLETED" || campaign.status === "CANCELLED") {
      return res.status(400).json({ message: `Campaign is already ${campaign.status}` });
    }

    campaign.status = "CANCELLED";
    await campaign.save();

    // Cancel pending outbox events and notifications
    await OutboxEvent.deleteMany({ campaignId, status: "PENDING" });
    await Notification.updateMany(
      { campaignId, status: { $in: ["SCHEDULED", "PENDING"] } },
      { status: "CANCELLED" }
    );

    return res.status(200).json({ message: "Campaign cancelled successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error cancelling campaign", error: error.message });
  }
};
