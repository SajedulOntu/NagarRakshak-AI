import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const newPassword = "Admin12345";

const hashedPassword = await bcrypt.hash(
    newPassword,
    12
);

await User.findOneAndUpdate(
    {
        email: "admin@dhakaipakhi.local"
    },
    {
        password: hashedPassword
    }
);

console.log("Admin password reset successfully");

process.exit();