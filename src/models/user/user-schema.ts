import mongoose, { Schema } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  password?: string;
  fullName: string;
  phoneNumber?: string;
  otp?: {
    code: string;
    expiresAt: Date;
  };
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  emailVerified: boolean;
  role:string;
  countryCode:string;
  level:string;
  profilePic:string
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
      required: function(this: UserDocument) {
        return !this.googleId && !this.facebookId && !this.appleId && !this.phoneNumber;
      },
    },
    authType:{
      type:String,
      enum:["manual","whatsapp","facebook","apple","google"]
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
    googleId: { 
      type: String,
      default: null,
    },
    facebookId: { 
      type: String ,
      default: null,
    },
    appleId: { 
      type: String,
      default: null,

    },
    emailVerified: { 
      type: Boolean,
      default: false,
    },
    otp:
      {
        code: {type: String, default: null,},
        expiresAt: {type:Date, default: null,}
        
      }

    
  },
  { timestamps: true }
);

export const usersModel = mongoose.model("users", usersSchema);
