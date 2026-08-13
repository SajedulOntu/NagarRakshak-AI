import jwt from "jsonwebtoken";
import User from "../models/User.js";

function createToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

// POST /api/auth/register
export async function registerUser(req, res) {
  try {
    const {
      name,
      email,
      password,
      role,
      organization = "",
      phone = "",
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password, and role are required.",
      });
    }

    const cleanEmail = normalizeEmail(email);

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    // Public registration must not create a Super Admin.
    if (role === "super-admin") {
      return res.status(403).json({
        success: false,
        message:
          "Super Admin accounts cannot be created through public registration.",
      });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: cleanEmail,
      password,
      role,
      organization: String(organization).trim(),
      phone: String(phone).trim(),
    });

    const token = createToken(user._id.toString());

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      const validationMessage =
        Object.values(error.errors)[0]?.message ||
        "Invalid registration information.";

      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create the account. Please try again.",
    });
  }
}

// POST /api/auth/login
export async function loginUser(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Email, password, and access portal are required.",
      });
    }

    const cleanEmail = normalizeEmail(email);

    const user = await User.findOne({
      email: cleanEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches =
      await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.role !== role) {
      return res.status(403).json({
        success: false,
        message:
          "This account does not belong to the selected access portal.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "This account has been disabled. Contact an administrator.",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = createToken(user._id.toString());

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to log in. Please try again.",
    });
  }
}