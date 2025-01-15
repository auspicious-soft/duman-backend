import mongoose from "mongoose";
export interface IUser {
    identifier: string;
    email: string;
    password?: string;
    name: string;
    facebookId?: string;
    googleId?: string;
    appleId?: string;
    whatsappId?: string;
    phoneNumber?: string;
    role: string;
    fullName: string;
    planType?: string;
    profilePic?: string;
    address?: string;
}

export interface AuthResponse {
    token: string;
    user: IUser;
}
const adminSchema = new mongoose.Schema({
  
    identifier: {
      type: String,
      // required: true,
      unique: true,
    },
    role: {
      type: String,
      requried: true,
    },
    fullName: {
      type: String,
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
      select: false,
    },
    phoneNumber: {
      type: String,
    },
    planType: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    facebookId: {
      type: String,
    },

    googleId: {
      type: String,
    },

    appleId: {
      type: String,
    },
    whatsappId: {
        type: String,
        },
    address: { type: String },
  },
  { timestamps: true }
);

export const adminModel = mongoose.model("admin", adminSchema);
