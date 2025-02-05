import { Request, Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { UserDocument, usersModel } from "../../models/user/user-schema";
import bcrypt from "bcryptjs";
import { generatePasswordResetToken, generatePasswordResetTokenByPhone, getPasswordResetTokenByToken } from "../../utils/mails/token";
import { httpStatusCode } from "../../lib/constant";
import { nestedQueryBuilder,  } from "src/utils";
import { ordersModel } from "../../models/orders/orders-schema";
import { deleteFileFromS3 } from "src/config/s3";
import { configDotenv } from "dotenv";

import { addedUserCreds, sendEmailVerificationMail, sendLoginCredentialsEmail, sendPasswordResetEmail } from "src/utils/mails/mail";
import { passwordResetTokenModel } from "src/models/password-token-schema";
import { generateOtpWithTwilio } from "src/utils/sms/sms";
import { generateUserToken, getSignUpQueryByAuthType, handleExistingUser, hashPasswordIfEmailAuth, sendOTPIfNeeded, validatePassword, validateUserForLogin } from "src/utils/userAuth/signUpAuth";

configDotenv();

export interface UserPayload {
  _id?: string;
  email: string;
  fullName: string;
  password?: string;
  phoneNumber?: string;
  language?: string;
  authType?: string;
  role?: string;
}

const sanitizeUser = (user: any): UserDocument => {
  const sanitized = user.toObject();
  delete sanitized.password;
  delete sanitized.otp;
  return sanitized;
};
export const loginUserService = async (userData: UserDocument, authType: string, res: Response) => {
  try {
    let query = getSignUpQueryByAuthType(userData, authType);
    let user: any = await usersModel.findOne(query);
    let validationResponse = validateUserForLogin(user, authType, userData, res);
    if (validationResponse) return validationResponse;

    if (authType === "Email") {
      let passwordValidationResponse = await validatePassword(userData, user.password, res);
      if (passwordValidationResponse) return passwordValidationResponse;
    }

    user.token = generateUserToken(user as any);
    await user.save();
    return {success:true, message: "User logged in successfully", data:sanitizeUser(user)};
  } catch (error: any) {
    return errorResponseHandler(error.message, httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

export const signUpService = async (userData: UserDocument, authType: string, res: Response) => {
  try {
    if (!authType) {
      return errorResponseHandler("Auth type is required", httpStatusCode.BAD_REQUEST, res);
    }

    if (authType === "Email" && (!userData.password || !userData.email)) {
      return errorResponseHandler("Both email and password is required for Email authentication", httpStatusCode.BAD_REQUEST, res);
    }

    const query = getSignUpQueryByAuthType(userData, authType);
    const existingUser = await usersModel.findOne(query);
    const existingUserResponse = existingUser ? handleExistingUser(existingUser as any, authType, res) : null;
    if (existingUserResponse) return existingUserResponse;

    const newUserData = { ...userData, authType };
    newUserData.password = await hashPasswordIfEmailAuth(userData, authType);

    const user = await usersModel.create(newUserData);
    await sendOTPIfNeeded(userData, authType);

    if (!process.env.AUTH_SECRET) {
      return errorResponseHandler("AUTH_SECRET is not defined", httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }

    user.token = generateUserToken(user as any);
    await user.save();
    return {success:true, message: "User created successfully", data: sanitizeUser(user)};
  } catch (error) {
    if (error instanceof Error) {
      return errorResponseHandler(error.message, httpStatusCode.INTERNAL_SERVER_ERROR, res);
    } else {
      return errorResponseHandler("An unknown error occurred", httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
  }
};

export const forgotPasswordUserService = async (payload: any, res: Response) => {
  const { email } = payload;
  const user = await usersModel.findOne({ email }).select("+password");
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
    existingUser = await usersModel.findOne({ email: existingToken.email, authType: "Email" });
  } else if (existingToken.phoneNumber) {
    existingUser = await usersModel.findOne({ phoneNumber: existingToken.phoneNumber });
  }
  if (!existingUser) {
    return errorResponseHandler(`Please try login with ${existingUser.authType}`, httpStatusCode.BAD_REQUEST, res);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const response = await usersModel.findByIdAndUpdate(existingUser._id, { password: hashedPassword }, { new: true });
  await passwordResetTokenModel.findByIdAndDelete(existingToken._id);

  return {
    success: true,
    message: "Password updated successfully",
    data: sanitizeUser(response),
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
  await addedUserCreds(newUser);
  newUser.password = await hashPasswordIfEmailAuth(payload, "Email");

  const response = await newUser.save();

  return {
    success: true,
    message: "User created successfully",
    data: response,
  };
};

export const getUserService = async (id: string, res: Response) => {
  const user = await usersModel.findById(id);
  if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  const totalAmountPaidResult = await ordersModel.aggregate([{ $match: { userId: user._id } }, { $group: { _id: null, totalAmount: { $sum: "$totalAmount" } } }]);
  const amountPaid = totalAmountPaidResult.length > 0 ? totalAmountPaidResult[0].totalAmount : 0;
  // Fetch all orders for the user
  const userOrders = await ordersModel.find({ userId: user._id }).populate({ path: "productIds", model: "products" });

  // Calculate the number of books purchased by the user
  const booksPurchasedCount = userOrders.reduce((count, order) => {
    return count + order.productIds.filter((product: any) => product.type === "e-book").length;
  }, 0);

  // Calculate the number of courses purchased by the user
  const courseCount = userOrders.reduce((count, order) => {
    return count + order.productIds.filter((product: any) => product.type === "course").length;
  }, 0);

  // Calculate the number of events attended by the user
  //  const eventsCount = await eventsModel.countDocuments({ userId: user._id });

  return {
    success: true,
    message: "User retrieved successfully",
    data: {
      data: user,
      amountPaid,
      booksPurchasedCount,
      courseCount,
      // Events,
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
  let { query, sort } = nestedQueryBuilder(payload, ["name", "email"]);
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
      message: "Users retrieved successfully",
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      limit,
      success: false,
      message: "No users found",
      total: 0,
    };
  }
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
  return {sucess: true, message: "OTP sent successfully"};
};

export const verifyOTPService = async (payload: any) => {
  const { email, phoneNumber, otp } = payload;

  const user = await usersModel.findOne({
    $or: [{ email }, { phoneNumber }],
    "otp.code": otp,
    "otp.expiresAt": { $gt: new Date() },
  });

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

  return { user: sanitizeUser(user) , message: "OTP verified successfully" };
};
