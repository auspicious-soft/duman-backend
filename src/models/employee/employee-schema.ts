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
const employeesSchema = new mongoose.Schema({
  
    identifier: {
      type: String,
      // required: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      default: "employee",
    },
    fullName: {
      type: String,
      required: true,
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

    address: { type: String },
  },
  { timestamps: true }
);

export const employeesModel = mongoose.model("employee", employeesSchema);
