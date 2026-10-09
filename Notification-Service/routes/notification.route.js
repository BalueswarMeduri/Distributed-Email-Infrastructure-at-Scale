import express from "express";
import {
  sendSingleEmail,
  sendBulkEmails,
  getUserCampaigns,
  getCampaignStatus,
  getNotificationById,
  cancelCampaign
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/send-single", sendSingleEmail);
router.post("/send-bulk", sendBulkEmails);
router.get("/campaigns/user/:userId", getUserCampaigns);
router.get("/campaigns/:campaignId/status", getCampaignStatus);
router.post("/campaigns/:campaignId/cancel", cancelCampaign);
router.get("/:id", getNotificationById);

export default router;
