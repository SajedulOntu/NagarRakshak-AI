import express from "express";

import {
  assignIssue,
  createIssue,
  getIssueById,
  getIssues,
  getMaintenanceTeams,
  updateIssueStatus,
} from "../controllers/issueController.js";

import {
  authorizeRoles,
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Get issues
router.get("/", getIssues);

// Create issue
router.post(
  "/",
  authorizeRoles(
    "super-admin",
    "dncc-north",
    "dncc-south",
  ),
  createIssue,
);

// Get maintenance accounts
router.get(
  "/maintenance-teams",
  authorizeRoles(
    "super-admin",
    "dncc-north",
    "dncc-south",
  ),
  getMaintenanceTeams,
);

// Assign issue to maintenance
router.patch(
  "/:id/assign",
  authorizeRoles(
    "super-admin",
    "dncc-north",
    "dncc-south",
  ),
  assignIssue,
);

// Update issue status
router.patch(
  "/:id/status",
  authorizeRoles(
    "super-admin",
    "dncc-north",
    "dncc-south",
    "maintenance",
  ),
  updateIssueStatus,
);

// Get single issue
router.get("/:id", getIssueById);

export default router;