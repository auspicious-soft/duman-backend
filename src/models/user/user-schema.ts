import mongoose, { Schema } from "mongoose";

const usersSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      default: "user",
    },
    fullName: {
      type: Object,
      requried: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
    },
    level: {
      type: String,
    },
    profilePic: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const usersModel = mongoose.model("users", usersSchema);
