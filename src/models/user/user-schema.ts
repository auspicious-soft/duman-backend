import mongoose, { Schema } from "mongoose";

export interface UserDocument extends Document {
  _id?:string;
  email?: string;
  password?: string;
  fullName?: string;
  phoneNumber?: string;
  otp?: {
    code: string;
    expiresAt: Date;
  };
  emailVerified: boolean;
  role?:string;
  countryCode?:string;
  level?:string;
  profilePic?:string;
  authType?:string
}
const usersSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      default: "user",
    },
    fullName: {
      type: Object,
      // requried: true,
      trim: true,
    },
    email: {
      type: String,
      // required: true,
      // unique: true,
      lowercase: true,
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
      default: "Email"
    },
    countryCode: {
      type: String,
    },
    phoneNumber: {
      type: String,
      default: null,  
    },
    level: {
      type: String,
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
      code: { type: String, default: null, },
      expiresAt: { type: Date,default: null, }
    },
    language:{
      type:String,
      enum:["kaz","eng","rus"],
      default:"eng"
    },
    token:{
      type:String,
    }
  },
  { timestamps: true }
);

export const usersModel = mongoose.model("users", usersSchema);
