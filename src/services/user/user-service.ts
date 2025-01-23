import { Request, Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { usersModel } from "../../models/user/user-schema";
import bcrypt from "bcryptjs";
import { adminModel } from "../../models/admin/admin-schema";
import { generatePasswordResetToken, generatePasswordResetTokenByPhone, getPasswordResetTokenByToken } from "../../utils/mails/token";
import { sendPasswordResetEmail } from "../../utils/mails/mail";
import { generatePasswordResetTokenByPhoneWithTwilio } from "../../utils/sms/sms";
import { httpStatusCode } from "../../lib/constant";
import { customAlphabet } from "nanoid";
import { queryBuilder } from "src/utils";
import { ordersModel } from "../../models/orders/orders-schema";
import { productsModel } from "../../models/products/products-schema";
import { eventsModel } from "../../models/events/events-schema";
import { deleteFileFromS3 } from "src/configF/s3";

export const signupService = async (payload: any, res: Response) => {
  const emailExists = await usersModel.findOne({ email: payload.email });
  if (emailExists) return errorResponseHandler("Email already exists", httpStatusCode.BAD_REQUEST, res);
  const phoneExists = await usersModel.findOne({
    phoneNumber: `${payload.phoneNumber}`,
  });
  if (phoneExists) return errorResponseHandler("phone Number already exists", httpStatusCode.BAD_REQUEST, res);

  payload.phoneNumber = `${payload.phoneNumber}`;
  const newPassword = bcrypt.hashSync(payload.password, 10);
  payload.password = newPassword;
  const genId = customAlphabet("1234567890", 8);
  const identifier = customAlphabet("0123456789", 3);

  payload.myReferralCode = `${process.env.NEXT_PUBLIC_APP_URL}/signup?referralCode=${genId()}`;
  payload.identifier = identifier();
  // if(payload.referralCode) {
  //     const referredBy = await usersModel.findOne({ myReferralCode: `${process.env.NEXT_PUBLIC_APP_URL}/signup?referralCode=${payload.referralCode}` })
  //     if (referredBy) {
  //         payload.referredBy = referredBy._id           //Set my referred by
  //         await increaseReferredCountAndCredits(referredBy._id)   //Increase referred count of the person who referred me
  //         await sendNotificationToUserService({ title: "Referral", message: "Congrats! A new user has signed up with your referral code", ids: [referredBy._id.toString()] }, res)   //Sending THE NOTIFICATION TO THE USER WHO REFERRED ME
  //     }
  // }
  new usersModel({
    ...payload,
    email: payload.email.toLowerCase().trim(),
  }).save();
  return { success: true, message: "Client signup successfull" };
};

export const loginService = async (payload: any, res: Response) => {
  const { email, phoneNumber, password } = payload;
  const query = email ? { email } : { phoneNumber };
  const client = await usersModel.findOne(query).select("+password");
  if (!client) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  const isPasswordValid = bcrypt.compareSync(password, client.password);
  if (!isPasswordValid) return errorResponseHandler("Invalid password", httpStatusCode.UNAUTHORIZED, res);
  const clientObject: any = client.toObject();
  delete clientObject.password;
  return { success: true, message: "Login successful", data: clientObject };
};

export const forgotPasswordService = async (payload: any, res: Response) => {
  const { email, phoneNumber, password } = payload;
  const query = email ? { email } : { phoneNumber };

  const client = await usersModel.findOne(query);
  if (!client) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

  if (email) {
    const passwordResetToken = await generatePasswordResetToken(email);
    if (passwordResetToken !== null) {
      await sendPasswordResetEmail(email, passwordResetToken.token);
      return { success: true, message: "Password reset email sent with otp" };
    }
  } else {
    const generatePasswordResetTokenBysms = await generatePasswordResetTokenByPhone(phoneNumber);

    if (generatePasswordResetTokenBysms !== null) {
      // await generatePasswordResetTokenByPhoneWithTwilio(phoneNumber, generatePasswordResetTokenBysms.token);
      return { success: true, message: "Password reset sms sent with otp" };
    }
  }
};

export const verifyOtpPasswordResetService = async (token: string, res: Response) => {
  const existingToken = await getPasswordResetTokenByToken(token);
  if (!existingToken) return errorResponseHandler("Invalid token", httpStatusCode.BAD_REQUEST, res);

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res);
  return { success: true, message: "Token verified successfully" };
};

export const newPassswordAfterOTPVerifiedService = async (payload: { password: string; otp: string }, res: Response) => {
  const { password, otp } = payload;
  const existingToken = await getPasswordResetTokenByToken(otp);
  if (!existingToken) return errorResponseHandler("Invalid OTP", httpStatusCode.BAD_REQUEST, res);

  const hasExpired = new Date(existingToken.expires) < new Date();
  if (hasExpired) return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res);

  let existingClient: any;

  if (existingToken.email) {
    existingClient = await adminModel.findOne({ email: existingToken.email });
    if (!existingClient) {
      existingClient = await usersModel.findOne({ email: existingToken.email });
    }
    if (!existingClient) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  } else if (existingToken.phoneNumber) {
    existingClient = await usersModel.findOne({
      phoneNumber: existingToken.phoneNumber,
    });
    if (!existingClient) {
      existingClient = await usersModel.findOne({
        phoneNumber: existingToken.phoneNumber,
      });
    }
    if (!existingClient) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (existingClient.role == "admin") {
    const response = await adminModel.findByIdAndUpdate(existingClient._id, { password: hashedPassword }, { new: true });
  } else {
    const response = await usersModel.findByIdAndUpdate(existingClient._id, { password: hashedPassword }, { new: true });
  }

  // await passwordResetTokenModel.findByIdAndDelete(existingToken._id)

  return {
    success: true,
    message: "Password updated successfully",
  };
};

export const passwordResetService = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const getAdmin = await usersModel.findById(req.params.id).select("+password");
  if (!getAdmin) return errorResponseHandler("Admin not found", httpStatusCode.NOT_FOUND, res);

  const passwordMatch = bcrypt.compareSync(currentPassword, getAdmin.password);
  if (!passwordMatch) return errorResponseHandler("Current password invalid", httpStatusCode.BAD_REQUEST, res);
  const hashedPassword = bcrypt.hashSync(newPassword, 10);
  const response = await usersModel.findByIdAndUpdate(req.params.id, {
    password: hashedPassword,
  });
  return {
    success: true,
    message: "Password updated successfully",
    data: response,
  };
};

export const getUserInfoService = async (id: string, res: Response) => {
  // const user = await usersModel.findById(id);
  // if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  // const userProjects = await projectsModel.find({ userId: id }).select("-__v");
  // return {
  //     success: true,
  //     message: "User retrieved successfully",
  //     data: {
  //         user,
  //         projects: userProjects.length > 0 ? userProjects : [],
  //     }
  // };
};

export const getUserInfoByEmailService = async (email: string, res: Response) => {
  const client = await usersModel.findOne({ email });
  if (!client) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Client info fetched successfully",
    data: client,
  };
};

export const editUserInfoService = async (id: string, payload: any, res: Response) => {
  const user = await usersModel.findById(id);
  if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
  payload.phoneNumber = `${payload.phoneNumber}`;
  const updateduser = await usersModel.findByIdAndUpdate(id, { ...payload }, { new: true });

  return {
    success: true,
    message: "User updated successfully",
    data: updateduser,
  };
};

export const createUserService = async (payload: any, res: Response) => {
  const emailExists = await usersModel.findOne({ email: payload.email });
  if (emailExists) return errorResponseHandler("Email already exists", httpStatusCode.BAD_REQUEST, res);
  const phoneNumber = `${payload.countryCode}${payload.phoneNumber}`;
  const phoneExists = await usersModel.findOne({
    phoneNumber: phoneNumber,
  });
  if (phoneExists) return errorResponseHandler("Phone number already exists", httpStatusCode.BAD_REQUEST, res);

  // Hash the password before saving the user
  const hashedPassword = bcrypt.hashSync(payload.password, 10);
  payload.password = hashedPassword;
  payload.phoneNumber = phoneNumber;

  const newUser = new usersModel(payload);
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
  if(deletedUser?.profilePic){
    await deleteFileFromS3(deletedUser?.profilePic)
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
  });;

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
  let { query, sort } = queryBuilder(payload, ["fullName"]);
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
