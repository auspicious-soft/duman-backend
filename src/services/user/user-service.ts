import { Request, Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { UserDocument, usersModel } from "../../models/user/user-schema";
import bcrypt from "bcryptjs";
import { generatePasswordResetToken, generatePasswordResetTokenByPhone, getPasswordResetTokenByToken } from "../../utils/mails/token";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { ordersModel } from "../../models/orders/orders-schema";
import { deleteFileFromS3 } from "src/configF/s3";
import { configDotenv } from "dotenv";
import jwt from "jsonwebtoken";

import twilio from "twilio";
import { sendEmailVerificationMail, sendLoginCredentialsEmail, sendPasswordResetEmail } from "src/utils/mails/mail";
import { passwordResetTokenModel } from "src/models/password-token-schema";
import { generateOtpWithTwilio } from "src/utils/sms/sms";
configDotenv();
// const resend = new Resend(process.env.RESEND_API_KEY);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
export interface UserPayload {
  email: string;
  fullName: string;
  password?: string;
  phoneNumber?: string;
  googleId?: string;
  facebookId?: string;
  appleId?: string;
  emailVerified?: boolean;
  language?: string;
  authType?:string
}

const sanitizeUser = (user: any): UserDocument => {
  const sanitized = user.toObject();
  delete sanitized.password;
  delete sanitized.otp;
  return sanitized;
};

export const forgotPasswordUserService = async (email: string, res: Response) => {
  const user = await usersModel.findOne({ email: email }).select("+password");
  if (!user) return errorResponseHandler("Email not found", httpStatusCode.NOT_FOUND, res);
  const passwordResetToken = await generatePasswordResetToken(email);

  if (passwordResetToken !== null) {
    await sendPasswordResetEmail(email, passwordResetToken.token, user.language);
    return { success: true, message: "Password reset email sent with otp" };
  }
};

export const newPassswordAfterOTPVerifiedUserService = async (payload: { password: string; otp: string }, res: Response) => {
  const { password, otp } = payload;

  const existingToken = await getPasswordResetTokenByToken(otp);
  if (!existingToken) return errorResponseHandler("Invalid OTP", httpStatusCode.BAD_REQUEST, res);

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res);

  let existingUser: any;

  if (existingToken.email) {
    existingUser = await usersModel.findOne({ email: existingToken.email });
  } else if (existingToken.phoneNumber) {
    existingUser = await usersModel.findOne({ phoneNumber: existingToken.phoneNumber });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const response = await usersModel.findByIdAndUpdate(existingUser._id, { password: hashedPassword }, { new: true });
  await passwordResetTokenModel.findByIdAndDelete(existingToken._id);

  return {
    success: true,
    message: "Password updated successfully",
    data: response,
  };
};

export const verifyOtpPasswordResetService = async (token: string, res: Response) => {
  const existingToken = await getPasswordResetTokenByToken(token);
  if (!existingToken) return errorResponseHandler("Invalid token", httpStatusCode.BAD_REQUEST, res);

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res);
  return { success: true, message: "Token verified successfully" };
};

export const createUserService = async (payload: any, res: Response) => {
  const emailExists = await usersModel.findOne({ email: payload.email });
  if (emailExists) return errorResponseHandler("Email already exists", httpStatusCode.BAD_REQUEST, res);
  const phoneExists = await usersModel.findOne({
    phoneNumber: payload.phoneNumber,
  });
  if (phoneExists) return errorResponseHandler("Phone number already exists", httpStatusCode.BAD_REQUEST, res);

  // Hash the password before saving the user
  // const hashedPassword = bcrypt.hashSync(payload.password, 10);
  // payload.password = hashedPassword;

  const newUser = new usersModel(payload);
  const response = await newUser.save();

  if (response.email && response.password) {
    await sendLoginCredentialsEmail(response.email, response.password);
  }
  return {
    success: true,
    message: "User created successfully",
    data: response,
  };
};

export const getUserService = async (id: string, res: Response) => {
  const user = await usersModel.findById(id);
  if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  const amountPaid = "0000";
  const booksPurchasedCount = "0000";
  const countCount = "0000";
  const Events = "0000";
  return {
    success: true,
    message: "User retrieved successfully",
    data: {
      data: user,
      amountPaid,
      booksPurchasedCount,
      countCount,
      Events,
    },
  };
};

export const updateUserService = async (id: string, payload: any, res: Response) => {
  const user = await usersModel.findById(id);
  if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

  const updatedUser = await usersModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  return {
    success: true,
    message: "User updated successfully",
    data: updatedUser,
  };
};

export const deleteUserService = async (id: string, res: Response) => {
  const user = await usersModel.findById(id);
  if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

  const deletedUser = await usersModel.findByIdAndDelete(id);
  if (deletedUser?.profilePic) {
    await deleteFileFromS3(deletedUser?.profilePic);
  }
  return {
    success: true,
    message: "User deleted successfully",
    data: deletedUser,
  };
};

export const getUserProfileDetailService = async (id: string, payload: any, res: Response) => {
  const user = await usersModel.findById(id);
  if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

  const year = payload.duration;
  const userOrders = await ordersModel.find({ userId: id }).populate({
    path: "productIds",
    populate: [
      { path: "authorId", model: "authors" },
      { path: "categoryId", model: "categories" },
    ],
  });

  let filteredOrders = userOrders;

  if (year) {
    filteredOrders = userOrders.filter((order: any) => {
      const parsedDate = new Date(order.createdAt);
      if (isNaN(parsedDate.getTime())) {
        console.warn("Invalid createdAt for order:", order);
        return false;
      }

      const orderYear = parsedDate.getFullYear().toString();
      return orderYear === year;
    });
  }

  const totalAmountPaid = filteredOrders.reduce((acc, order) => acc + order.totalAmount, 0);

  const coursesPurchased = filteredOrders
    .flatMap((order) => order.productIds)
    .filter((product: any) => product?.type === "course")
    .map((product) => product._id);

  const booksPurchased = filteredOrders
    .flatMap((order) => order.productIds)
    .filter((product: any) => product?.type === "e-book")
    .map((product) => product._id);

  const booksPurchasedCount = booksPurchased.length;
  const coursesCount = coursesPurchased.length;

  return {
    success: true,
    message: "User profile details retrieved successfully",
    data: {
      user,
      userOrders: userOrders,
      totalAmountPaid: totalAmountPaid || 0,
      booksPurchasedCount: booksPurchasedCount || 0,
      coursesCount: coursesCount || 0,
      eventsCount: 0,
    },
  };
};

export const getAllUserService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  let { query, sort } = queryBuilder(payload, ["fullName.kaz", "fullName.eng", "fullName.rus", "email"]);
  if (payload.duration) {
    const durationDays = parseInt(payload.duration);
    if (durationDays === 30 || durationDays === 7) {
      const date = new Date();
      date.setDate(date.getDate() - durationDays);
      (query as any) = { ...query, createdAt: { $gte: date } };
    }
  }
  const totalDataCount = Object.keys(query).length < 1 ? await usersModel.countDocuments() : await usersModel.countDocuments(query);
  const results = await usersModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
  if (results.length)
    return {
      page,
      limit,
      success: true,
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      limit,
      success: false,
      total: 0,
    };
  }
};

export const signUpUser = async (userData: UserPayload) => {
  const existingUser = await usersModel.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : undefined;
  const user = await usersModel.create({
    ...userData,
    password: hashedPassword,
  });
  await generateAndSendOTP({ email: userData.email });

  return sanitizeUser(user);
};

export const loginWithEmail = async (email: string, password: string, res:Response) => {
  const user = await usersModel.findOne({ email, emailVerified: true });
  if (!user || !user.password) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }
  
  if (!process.env.AUTH_SECRET) {
    return errorResponseHandler("AUTH_SECRET is not defined", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
  const token = jwt.sign({ id: user._id, phoneNumber: user.phoneNumber }, process.env.AUTH_SECRET);
  return {
    success: true,
    message: "Login successful",
    data: sanitizeUser(user),
    token:token
    
  };
};

export const SignUpWithWhatsappService = async (userData: UserPayload) => {
  const existingUser = await usersModel.findOne({ phoneNumber: userData.phoneNumber });
  if (existingUser) {
    throw new Error("phoneNumber already registered");
  }

  const user = await usersModel.create({
    phoneNumber:userData.phoneNumber,
    authType: userData.authType
  });
  await generateAndSendOTP({ phoneNumber: userData.phoneNumber });

  return sanitizeUser(user);
};

export const loginWithPhoneNumber = async (phoneNumber: string, res: Response) => {
  const user = await usersModel.findOne({
    phoneNumber,
  });
  if (user && user.authType !== "Whatsapp") {
    return errorResponseHandler(`Try login from ${user.authType}`, httpStatusCode.BAD_REQUEST, res);
  }
  if (user && user.authType == "Whatsapp" && user.whatsappNumberVerified!==true) {
    return errorResponseHandler("Number is not verified", httpStatusCode.BAD_REQUEST, res);
  }
  if (!user) {
    return errorResponseHandler("Number is not registered", httpStatusCode.BAD_REQUEST, res);
  }
 
  if (!process.env.AUTH_SECRET) {
    return errorResponseHandler("AUTH_SECRET is not defined", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
  const token = jwt.sign({ id: user._id, phoneNumber: user.phoneNumber }, process.env.AUTH_SECRET);
  // user.otp = null;
  await user.save();

  return {
    success: true,
    message: "Login successful",
    data: sanitizeUser(user),
    token:token
    
  };
};

export const SignUpWithGoogleService = async (userData: UserPayload) => {
  const existingUser = await usersModel.findOne({ email: userData.email });
  if (existingUser) {
    throw new Error("email already registered");
  }

  const user = await usersModel.create({
    phoneNumber:userData.phoneNumber,
    authType: userData.authType
  });
  await generateAndSendOTP({ phoneNumber: userData.phoneNumber });

  return sanitizeUser(user);
};

export const generateAndSendOTP = async (payload: { email?: string; phoneNumber?: string }) => {
  const { email, phoneNumber } = payload;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000); // 20 minutes

  const user = await usersModel.findOneAndUpdate(
    {
      $or: [{ email }, { phoneNumber }],
    },
    {
      $set: {
        "otp.code": otp,
        "otp.expiresAt": expiresAt,
      },
    },
    { upsert: true }
  );

  if (phoneNumber) {
    await generateOtpWithTwilio(phoneNumber, otp);
  }
  if (email) {
    await sendEmailVerificationMail(email, otp, user?.language || "en");
  }
  if (user) {
    await user.save();
  }
  return true;
};

export const verifyOTPService = async (payload: any) => {
  const { email, phoneNumber, otp } = payload;
  console.log("phoneNumber: ", phoneNumber);
  console.log("payload: ", payload);
  const user = await usersModel.findOne({
    $or: [{ email }, { phoneNumber }],
    "otp.code": otp,
    "otp.expiresAt": { $gt: new Date() },
  });
  console.log('user: ', user);

  if (!user) {
    throw new Error("Invalid or expired OTP");
  }

  if (user.otp) {
    user.otp.code = "";
    user.otp.expiresAt = new Date(0);
  }
  if (email) {
    user.emailVerified = true;
  }
  if (phoneNumber) {
    user.whatsappNumberVerified = true;
  }
  await user.save();

  return { user: sanitizeUser(user) };
};
