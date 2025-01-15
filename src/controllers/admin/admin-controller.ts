import { Request, Response } from "express"
import { formatZodErrors } from "../../validation/format-zod-errors";
import { loginService, newPassswordAfterOTPVerifiedService, forgotPasswordService, getAUserService, updateAUserService, deleteAUserService, getDashboardStatsService, getNewUsersService, getAdminDetailsService } from "../../services/admin/admin-service";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";

// import { config } from '../../configF/config';
// // import { IUser, AuthResponse } from '../types/user.types';
// import { getAllUsers } from './admin-controller';
// export interface IUser {
//     identifier: string;
//     email: string;
//     password?: string;
//     name: string;
//     facebookId?: string;
//     googleId?: string;
//     appleId?: string;
//     whatsappId?: string;
//     phoneNumber?: string;
//     role: string;
//     fullName: string;
//     planType?: string;
//     profilePic?: string;
//     address?: string;
// }

// export interface AuthResponse {
//     token: string;
//     user: IUser;
// }
// export class loginController {
//     private generateToken(user: IUser): string {
//         return jwt.sign(
//             { id: user.identifier, email: user.email },
//             config.jwt.secret,
//             { expiresIn: config.jwt.expiresIn }
//         );
//     }

//     private handleAuthResponse(req: Request, res: Response): void {
//         const token = this.generateToken(req.user as IUser);
//         const response: AuthResponse = { token, user: req.user as IUser };
        
//         if (req.headers['user-agent']?.includes('Mozilla')) {
//             res.redirect(`${config.app.webUrl}?token=${token}`);
//         } else {
//             res.redirect(`${config.app.mobileScheme}://auth?token=${token}`);
//         }
//     }

//     public emailLogin(req: Request, res: Response): void {
//         const token = this.generateToken(req.user as IUser);
//         const response: AuthResponse = { token, user: req.user as IUser };
//         res.json(response);
//     }

//     public socialCallback(req: Request, res: Response): void {
//         this.handleAuthResponse(req, res);
//     }
// }

//Auth Controllers
export const login = async (req: Request, res: Response) => {
    console.log('req: ', req);
    try {

        const response = await loginService(req.body, res)
        return res.status(httpStatusCode.OK).json(response)

    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}
export const getAdminDetails = async (req: Request, res: Response) => {
    try {

        const response = await getAdminDetailsService(req.body, res)
        return res.status(httpStatusCode.OK).json(response)

    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const forgotPassword = async (req: Request, res: Response) => {

    try {
        const response = await forgotPasswordService(req.body.username, res)
        return res.status(httpStatusCode.OK).json(response)
    }
    catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
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

export const getNewUsers = async (req: Request, res: Response) => {
    try {
        const response = await getNewUsersService(req.query)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}


export const getAUser = async (req: Request, res: Response) => {
    try {
        const response = await getAUserService(req.params.id, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const deleteAUser = async (req: Request, res: Response) => {
    try {
        const response = await deleteAUserService(req.params.id, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const updateAUser = async (req: Request, res: Response) => {
    try {
        const response = await updateAUserService(req.params.id, req.body, res);
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const response = await getDashboardStatsService(req.query, res)
        return res.status(httpStatusCode.OK).json(response)
    } catch (error: any) {
        const { code, message } = errorParser(error)
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}
