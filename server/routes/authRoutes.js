import express from "express";

import {
  loginUser,
  registerUser,
} from "../controllers/authController.js";

import {
  authorizeRoles,
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", protect, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
  });
});

router.get(
  "/admin-only",
  protect,
  authorizeRoles("super-admin"),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Super Admin access granted.",
    });
  },
);

router.get(
  "/authority-only",
  protect,
  authorizeRoles(
    "super-admin",
    "dncc-north",
    "dncc-south",
  ),
  (req, res) => {
    return res.status(200).json({
      success: true,
      message: "Authority access granted.",
    });
  },
);

export default router;