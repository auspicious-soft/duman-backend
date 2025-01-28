import { Request, Response } from "express"
import { httpStatusCode } from "../../lib/constant"
import { errorParser } from "../../lib/errors/error-response-handler"
import { clientSignupSchema, passswordResetSchema } from "../../validation/client-user"
import { formatZodErrors } from "../../validation/format-zod-errors"
// import { loginService, signupService, forgotPasswordService, newPassswordAfterOTPVerifiedService, passwordResetService, getUserInfoService, getUserInfoByEmailService, editUserInfoService, verifyOtpPasswordResetService, deleteUserService, getAllUserService, updateUserService, getUserService, createUserService, getUserProfileDetailService } from "../../services/user/user-service"
import { z } from "zod"
import mongoose from "mongoose"
import { createUser, createUserService, deleteUserService, generateAndSendOTP, getAllUserService, getUserProfileDetailService, getUserService, loginWithEmail, updateUserService, verifyOTP } from "src/services/user/user-service"
import { newPassswordAfterOTPVerifiedService } from "src/services/admin/admin-service"
import {verifyOtpPasswordResetService} from '../../services/user/user-service'
import { UserDocument } from "src/models/user/user-schema"
// export const signup = async (req: Request, res: Response) => {
//     const validation = clientSignupSchema.safeParse(req.body)
//     if (!validation.success) return res.status(httpStatusCode.BAD_REQUEST).json({ success: false, message: formatZodErrors(validation.error) })
//     try {
//         const response: any = await signupService(req.body, res)
//         return res.status(httpStatusCode.CREATED).json(response)
//     }
//     catch (error: any) {
//         const { code, message } = errorParser(error)
//         return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" })
//     }
// }

// export const login = async (req: Request, res: Response) => {
  
//     try {
//         const response = await loginService(req.body, res)
//         return res.status(httpStatusCode.OK).json(response)
//     }
//     catch (error: any) {
//         const { code, message } = errorParser(error)
//         return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" })
//     }
// }

// export const forgotPassword = async (req: Request, res: Response) => {
   
//     try {
//         const response = await forgotPasswordService(req.body, res)
//         return res.status(httpStatusCode.OK).json(response)
//     }
//     catch (error: any) {
//         const { code, message } = errorParser(error)
//         return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" })
//     }
// }

export const verifyOtpPasswordReset = async (req: Request, res: Response) => {
    const { otp } = req.body
    try {
        const response = await verifyOtpPasswordResetService(otp, res)
        return res.status(httpStatusCode.OK).json(response)
    }
    catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" })
    }
}

export const newPassswordAfterOTPVerified = async (req: Request, res: Response) => {
    try {
        const response = await newPassswordAfterOTPVerifiedService(req.body, res)
        return res.status(httpStatusCode.OK).json(response)
    }
    catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

// export const passwordReset = async (req: Request, res: Response) => {
//     const validation = passswordResetSchema.safeParse(req.body)
//     if (!validation.success) return res.status(httpStatusCode.BAD_REQUEST).json({ success: false, message: formatZodErrors(validation.error) })
//     try {
//         const response = await passwordResetService(req, res)
//         return res.status(httpStatusCode.OK).json(response)
//     } catch (error: any) {
//         const { code, message } = errorParser(error)
//         return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
//     }
// }


// export const getUserInfo = async (req: Request, res: Response) => {
//     try {
//         const response = await getUserInfoService(req.params.id, res)
//         return res.status(httpStatusCode.OK).json(response)
//     } catch (error: any) {
//         const { code, message } = errorParser(error)
//         return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
//     }
// }

// export const getUserInfoByEmail = async (req: Request, res: Response) => {
//     try {
//         const response = await getUserInfoByEmailService(req.params.email, res)
//         return res.status(httpStatusCode.OK).json(response)
//     } catch (error: any) {
//         const { code, message } = errorParser(error)
//         return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
//     }
// }

// export const editUserInfo = async (req: Request, res: Response) => {
//     try {
//         const response = await editUserInfoService(req.params.id, req.body, res);
//         return res.status(httpStatusCode.OK).json(response)
//     } catch (error: any) {
//         const { code, message } = errorParser(error)
//         return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
//     }
// }

// Dashboard
export const getUserDashboardStats = async (req: Request, res: Response) => {
    try {
        
        const response = await getUserProfileDetailService(req.params.id,req.query, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const createNewUser = async (req: Request, res: Response) => {
    try {
        const response = await createUserService(req.body, res)
        return res.status(httpStatusCode.CREATED).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" })
    }
}

export const getUser = async (req: Request, res: Response) => {
    try {
        const response = await getUserService(req.params.id, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" })
    }
}
export const getAllUser = async (req: Request, res: Response) => {
    try {
        const response = await getAllUserService(req.query, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" })
    }
}

export const updateUser = async (req: Request, res: Response) => {
    try {
        const response = await updateUserService(req.params.id, req.body, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" })
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const response = await deleteUserService(req.params.id, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" })
    }
}

export const emailSignup = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { email, password, name } = req.body;
      const user = await createUser({ email, password, name });
      
      res.status(201).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };
  
  export const emailSignin = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { email, password } = req.body;
      const { user } = await loginWithEmail(email, password);
      
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };
  
  export const sendWhatsAppOTP = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { phoneNumber } = req.body;
      await generateAndSendOTP(phoneNumber);
      
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };
  
  export const verifyWhatsAppOTP = async (
    req: Request,
    res: Response
  ) => {
    try {
      const { phoneNumber, otp } = req.body;
      const { user } = await verifyOTP(phoneNumber, otp);
      
      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };


