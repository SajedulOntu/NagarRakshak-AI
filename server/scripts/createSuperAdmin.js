import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "../models/User.js";
import { connectDatabase } from "../config/db.js";

dotenv.config();

async function createSuperAdmin() {
  try {
    await connectDatabase();

    const existingAdmin = await User.findOne({
      role: "super-admin",
    });

    if (existingAdmin) {
      console.log(
        "A Super Admin account already exists:",
        existingAdmin.email,
      );

      await mongoose.connection.close();
      return;
    }

    const admin = await User.create({
      name: "DhakAI-PAKHI Super Admin",
      email: "admin@dhakaipakhi.local",
      password: "Admin12345",
      role: "super-admin",
      organization: "DhakAI-PAKHI",
      phone: "",
    });

    console.log(
      "Super Admin created successfully.",
    );

    console.log(
      "Email:",
      admin.email,
    );

    await mongoose.connection.close();
  } catch (error) {
    console.error(
      "Unable to create Super Admin:",
      error.message,
    );

    await mongoose.connection.close();

    process.exit(1);
  }
}

createSuperAdmin();