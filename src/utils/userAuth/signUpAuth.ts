import { httpStatusCode } from "src/lib/constant";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { UserDocument } from "src/models/user/user-schema";
import { generateAndSendOTP } from "src/services/user/user-service";
import { Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const generateUserToken = (user:UserDocument) => {
  const tokenPayload = {
    id: user._id,
    role: user.role,
    email: user.email || undefined,
    phoneNumber: user.phoneNumber || undefined,
  };

  if (!process.env.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not defined");
  }

  return jwt.sign(tokenPayload, process.env.AUTH_SECRET);
};

export const getSignUpQueryByAuthType = (userData:UserDocument, authType:string) => {
  if (["Email", "Google", "Apple", "Facebook"].includes(authType)) {
    return { email: userData.email };
  } else if (authType === "Whatsapp") {
    return { phoneNumber: userData.phoneNumber };
  }
  return {};
};

export const handleExistingUser = (existingUser:UserDocument, authType:string, res:Response) => {
  if (existingUser) {
    const message =
      authType === "Whatsapp"
        ? "Phone number already registered"
        : `Email already registered, try logging in with ${existingUser?.authType}`;
    return errorResponseHandler(message, httpStatusCode.BAD_REQUEST, res);
  }
};

export const hashPasswordIfEmailAuth = async (userData:UserDocument, authType:string) => {
  if (authType === "Email") {
    if (!userData.password) {
      throw new Error("Password is required for Email authentication");
    }
    return await bcrypt.hash(userData.password, 10);
  }
  return userData.password;
};

export const sendOTPIfNeeded = async (userData:UserDocument, authType:string) => {
  if (["Email", "Whatsapp"].includes(authType)) {
    await generateAndSendOTP(
      authType === "Email"
        ? { email: userData.email }
        : { phoneNumber: `${userData.countryCode}${userData.phoneNumber}` }
    );
  }
};

export const validateUserForLogin = (user:any, authType:string, userData:UserDocument, res:Response) => {
  if (!user) {
    return errorResponseHandler(
      authType === 'Email' ? "User not found" : "Number is not registered",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }
  if(authType !== user.authType){
    return errorResponseHandler(`Wrong Login method!!, Try login from ${user.authType}`, httpStatusCode.BAD_REQUEST, res);
  }
  if (authType === 'Email' && (!user.password || !userData.password)) {
    return errorResponseHandler("Password is required for Email login", httpStatusCode.BAD_REQUEST, res);
  }
  if (authType === 'Email' && user.emailVerified===false) {
    return errorResponseHandler("Email not verified", httpStatusCode.BAD_REQUEST, res);
  }
  if (authType === 'Whatsapp' && user.whatsappNumberVerified === false) {
    return errorResponseHandler(`Try login from ${user.authType}`, httpStatusCode.BAD_REQUEST, res);
  }
  if (authType === 'Whatsapp' && !user.whatsappNumberVerified) {
    return errorResponseHandler("Number is not verified", httpStatusCode.BAD_REQUEST, res);
  }

  return null;
};


export const validatePassword = async (user:UserDocument, userPassword: string, res:Response) => {
    if (!userPassword) {
      return errorResponseHandler("User password is missing", httpStatusCode.BAD_REQUEST, res);
    }
    if (!user.password) {
      return errorResponseHandler("User password is missing", httpStatusCode.BAD_REQUEST, res);
    }
    const isPasswordValid = await bcrypt.compare(user.password, userPassword);
    if (!isPasswordValid) {
      return errorResponseHandler("Invalid email or password", httpStatusCode.BAD_REQUEST, res);
    }
  };