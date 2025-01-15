import { adminModel } from "../../models/admin/admin-schema";
import bcrypt from "bcryptjs";
import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import jwt from "jsonwebtoken";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "../../utils";
import { sendPasswordResetEmail } from "src/utils/mails/mail";
import { generatePasswordResetToken, getPasswordResetTokenByToken, generatePasswordResetTokenByPhone } from "src/utils/mails/token";
import { generatePasswordResetTokenByPhoneWithTwilio } from "../../utils/sms/sms"
import { passwordResetTokenModel } from "src/models/password-token-schema";
import { usersModel } from "src/models/user/user-schema";
import { eventsModel } from "../../models/events/events-schema";

export const loginService = async (payload: any, res: Response) => {
    const { username, password } = payload;
    const countryCode = "+45"; 
    const toNumber = Number(username);
    const isEmail = isNaN(toNumber); 
    let user: any = null;

    if (isEmail) {

        user = await adminModel.findOne({ email: username }).select('+password');
        if (!user) {
            user = await usersModel.findOne({ email: username }).select('+password');
        }
    } else {

        const formattedPhoneNumber = `${countryCode}${username}`;
        user = await adminModel.findOne({ phoneNumber: formattedPhoneNumber }).select('+password');
        if (!user) {
            user = await usersModel.findOne({ phoneNumber: formattedPhoneNumber }).select('+password');
        }
    }

    if (!user) return errorResponseHandler('User not found', httpStatusCode.NOT_FOUND, res);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return errorResponseHandler('Invalid password', httpStatusCode.UNAUTHORIZED, res);
    }
    const userObject = user.toObject();
    delete userObject.password;
    

    return {
        success: true,
        message: "Login successful",
        data: {
            user: userObject,
        },
    };
};



// export class loginService {
//     async findById(id: string): Promise<IUser | null> {
//         return adminModel.findById(id);
//     }

//     async validateLocalUser(email: string, password: string, done: any): Promise<void> {
//         try {
//             const user = await adminModel.findOne({ email });
            
//             if (!user || !user.password) {
//                 return done(null, false, { message: 'User not found' });
//             }

//             const isMatch = await bcrypt.compare(password, user.password);
//             if (!isMatch) {
//                 return done(null, false, { message: 'Invalid password' });
//             }

//             return done(null, user);
//         } catch (error) {
//             return done(error);
//         }
//     }

//     async handleFacebookAuth(accessToken: string, refreshToken: string, profile: any, done: any): Promise<void> {
//         try {
//             let user = await adminModel.findOne({ facebookId: profile.id });
            
//             if (!user) {
//                 user = await adminModel.create({
//                     facebookId: profile.id,
//                     email: profile.emails[0].value,
//                     name: `${profile.name.givenName} ${profile.name.familyName}`
//                 });
//             }
            
//             return done(null, user);
//         } catch (error) {
//             return done(error);
//         }
//     }

//     async handleGoogleAuth(accessToken: string, refreshToken: string, profile: any, done: any): Promise<void> {
//         try {
//             let user = await adminModel.findOne({ googleId: profile.id });
            
//             if (!user) {
//                 user = await adminModel.create({
//                     googleId: profile.id,
//                     email: profile.emails[0].value,
//                     name: profile.displayName
//                 });
//             }
            
//             return done(null, user);
//         } catch (error) {
//             return done(error);
//         }
//     }

//     async handleAppleAuth(accessToken: string, refreshToken: string, profile: any, done: any): Promise<void> {
//         try {
//             let user = await adminModel.findOne({ appleId: profile.id });
            
//             if (!user) {
//                 user = await adminModel.create({
//                     appleId: profile.id,
//                     email: profile.email,
//                     name: profile.name
//                 });
//             }
            
//             return done(null, user);
//         } catch (error) {
//             return done(error);
//         }
//     }

//     async handleWhatsAppAuth(accessToken: string, refreshToken: string, profile: any, done: any): Promise<void> {
//         try {
//             let user = await adminModel.findOne({ whatsappId: profile.id });
            
//             if (!user) {
//                 user = await adminModel.create({
//                     whatsappId: profile.id,
//                     phoneNumber: profile.phoneNumber,
//                     name: profile.name
//                 });
//             }
            
//             return done(null, user);
//         } catch (error) {
//             return done(error);
//         }
//     }
// }

// export const forgotPasswordService = async (payload: any, res: Response) => {
//     const { username } = payload;
//     const countryCode = "+45";
//     const toNumber = Number(username);
//     const isEmail = isNaN(toNumber);
//     let user: any = null;
//     if (isEmail) {
   
//         user = await adminModel.findOne({ email: username }).select('+password');
//         if (!user) {
//             user = await usersModel.findOne({ email: username }).select('+password');
//         }
//         if (!user) return errorResponseHandler('User not found', httpStatusCode.NOT_FOUND, res);
     
//         const passwordResetToken = await generatePasswordResetToken(username);
//         if (passwordResetToken) {
//             await sendPasswordResetEmail(username, passwordResetToken.token);
//             return { success: true, message: "Password reset email sent with OTP" };
//         }
//     } else {
//         const formattedPhoneNumber = `${countryCode}${username}`;
//         user = await adminModel.findOne({ phoneNumber: formattedPhoneNumber }).select('+password');
//         if (!user) {
//             user = await usersModel.findOne({ phoneNumber: formattedPhoneNumber }).select('+password');
//         }
//         if (!user) return errorResponseHandler('User not found', httpStatusCode.NOT_FOUND, res);
       
//         const passwordResetTokenBySms = await generatePasswordResetTokenByPhone(formattedPhoneNumber);
//         if (passwordResetTokenBySms) {
//             await generatePasswordResetTokenByPhoneWithTwilio(formattedPhoneNumber, passwordResetTokenBySms.token);
//             return { success: true, message: "Password reset SMS sent with OTP" };
//         }
//     }

//     return errorResponseHandler('Failed to generate password reset token', httpStatusCode.INTERNAL_SERVER_ERROR, res);
// };

export const forgotPasswordService = async (email: string, res: Response) => {
    const admin = await adminModel.findOne({ email: email }).select('+password');
    if (!admin) return errorResponseHandler("Email not found", httpStatusCode.NOT_FOUND, res)
    const passwordResetToken = await generatePasswordResetToken(email)

    if (passwordResetToken !== null) {
        await sendPasswordResetEmail(email, passwordResetToken.token)
        return { success: true, message: "Password reset email sent with otp" }
    } 
}

export const newPassswordAfterOTPVerifiedService = async (payload: { password: string, otp: string }, res: Response) => {
    const { password, otp } = payload

    const existingToken = await getPasswordResetTokenByToken(otp)
    if (!existingToken) return errorResponseHandler("Invalid OTP", httpStatusCode.BAD_REQUEST, res)

    const hasExpired = new Date(existingToken.expires) < new Date()
    if (hasExpired) return errorResponseHandler("OTP expired", httpStatusCode.BAD_REQUEST, res)

        let existingAdmin:any;

        if (existingToken.email) {
          existingAdmin = await adminModel.findOne({ email: existingToken.email });
        } 
        else if (existingToken.phoneNumber) {
          existingAdmin = await adminModel.findOne({ phoneNumber: existingToken.phoneNumber });
        }

    const hashedPassword = await bcrypt.hash(password, 10)
    const response = await adminModel.findByIdAndUpdate(existingAdmin._id, { password: hashedPassword }, { new: true });
    await passwordResetTokenModel.findByIdAndDelete(existingToken._id);

    return {
        success: true,
        message: "Password updated successfully",
        data: response
    }
}

export const getAdminDetailsService = async (payload: any, res: Response) => {
    
    const results = await adminModel.find()
     return {
        success: true,
        data: results
    }
   
}

export const getNewUsersService = async (payload: any) => {
    const page = parseInt(payload.page as string) || 1
    const limit = parseInt(payload.limit as string) || 0
    const offset = (page - 1) * limit
    let { query, sort } = queryBuilder(payload, ['fullName'])
    if (payload.duration) {
        const durationDays = parseInt(payload.duration);
        if (durationDays === 30 || durationDays === 7) {
            const date = new Date();
            date.setDate(date.getDate() - durationDays);
            console.log('date: ', date);
            (query as any) = { ...query, createdAt: { $gte: date } };
        }
    }
    const totalDataCount = Object.keys(query).length < 1 ? await usersModel.countDocuments() : await usersModel.countDocuments(query)
    const results = await usersModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v")
    if (results.length) return {
        page,
        limit,
        success: true,
        total: totalDataCount,
        data: results
    }
    else {
        return {
            data: [],
            page,
            limit,
            success: false,
            total: 0
        }
    }
}

export const getAUserService = async (id: string, res: Response) => {
  const user = await usersModel.findById(id);
  if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

  return {
      success: true,
      message: "User retrieved successfully",
      data: {
          user,
      }
  };
}


export const updateAUserService = async (id: string, payload: any, res: Response) => {
    const user = await usersModel.findById(id);
    if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);
    const countryCode = "+45";
    payload.phoneNumber = `${countryCode}${payload.phoneNumber}`;
    const updateduser = await usersModel.findByIdAndUpdate(id,{ ...payload },{ new: true});

    return {
        success: true,
        message: "User updated successfully",
        data: updateduser,
    };

};


export const deleteAUserService = async (id: string, res: Response) => {
    // const user = await usersModel.findById(id);
    // if (!user) return errorResponseHandler("User not found", httpStatusCode.NOT_FOUND, res);

    // // Delete user projects ----
    // const userProjects = await projectsModel.deleteMany({ userId: id })

    // // Delete user ----
    // await usersModel.findByIdAndDelete(id)

    // return {
    //     success: true,
    //     message: "User deleted successfully",
    //     data: {
    //         user,
    //         projects: userProjects
    //     }
    // }
}


// Dashboard
export const getDashboardStatsService = async (payload: any, res: Response) => {
    console.log('payload: ', payload);
    
    try {
        const overviewDuration  = parseInt(payload.overviewDuration);
        const usersDuration = parseInt(payload.usersDuration);
        let overviewDate = new Date();
        if (overviewDuration === 30 || overviewDuration === 7) {
            overviewDate.setDate(overviewDate.getDate() - overviewDuration);
        }
        
        let usersDate = new Date();
        if (usersDuration === 30 || usersDuration === 7) {
            usersDate.setDate(usersDate.getDate() - usersDuration);
        }

        const newestUsers = await usersModel.find({ createdAt: { $gte: usersDate } }).sort({ createdAt: -1 }).limit(10).select("-__v");
        const newestEvents = await eventsModel.find({ createdAt: { $gte: usersDate } }).sort({ createdAt: -1 }).limit(10).select("-__v");
        const newUsersCount = await usersModel.countDocuments({ createdAt: { $gte: overviewDate } });
        const eventsCount = await eventsModel.countDocuments({ createdAt: { $gte: overviewDate } });
        const otherData = {
            newBooks: 0,
            totalRevenue: 0,
        };

        return {
            success: true,
            message: "Dashboard stats fetched successfully",
            data: {
                newestUsers,
                newestEvents,
                newUsersCount,
                eventsCount,
                ...otherData,
            },
        };
    } catch (error) {
        return errorResponseHandler('Failed to fetch dashboard stats', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
}
