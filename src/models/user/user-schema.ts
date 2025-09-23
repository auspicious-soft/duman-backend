import mongoose, { Schema } from "mongoose";
import { customAlphabet } from "nanoid";

export interface UserDocument extends Document {
  _id?: string;
  email?: string;
  password?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  otp?: {
    code: string;
    expiresAt: Date;
  };
  emailVerified: boolean;
  role?: string;
  countryCode?: string;
  level?: string;
  profilePic?: string;
  authType?: string;
  schoolVoucher?: string;
  wallet?:number;
  fcmToken?:string;
}
const usersSchema = new mongoose.Schema(
  {
     identifier: {
        type: String,
        required: true,
        unique: true,
        default: () => customAlphabet("0123456789", 5)()
      },
    role: {
      type: String,
      required: true,
      default: "user",
    },
    fullName: {
      type: Object,
      // requried: true,
      trim: true,
      default: null,
    },
    firstName: {
      type: Object,
      // requried: true,
      trim: true,
      default: null,
    },
    lastName: {
      type: Object,
      // requried: true,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      // required: true,
      // unique: true,
      lowercase: true,
      default: null,
    },
    password: {
      type: String,
      // required: function(this: UserDocument) {
      //   return !this.googleId && !this.facebookId && !this.appleId && !this.phoneNumber;
      // },
    },
    authType: {
      type: String,
      enum: ["Email", "Whatsapp", "Facebook", "Apple", "Google"],
      default: "Email",
    },
    countryCode: {
      type: String,
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    profilePic: {
      type: String,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    whatsappNumberVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      code: { type: String, default: null },
      expiresAt: { type: Date, default: null },
    },
    language: {
      type: String,
      enum: ["kaz", "eng", "rus"],
      default: "eng",
    },
    token: {
      type: String,
    },
    schoolVoucher: {
      voucherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bookSchools",
      },
      createdAt: { type: Date, default: null },
      expiredAt: { type: Date, default:null },
    },
    fcmToken: {
      type: String,
      default: null,
    },
    productsLanguage: {
      type: [String],
      enum: ["kaz", "eng", "rus"],
      default: "eng",
    },
    dob: {
      type: Date,
    },
    country: {
      type: String,
    },
    wallet:{
      type: Number,
      default: 0,
    },
    notificationAllowed: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const usersModel = mongoose.model("users", usersSchema);
