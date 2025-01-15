import { Router } from "express";
import {  forgotPassword, getAdminDetails, getDashboardStats,   getNewUsers,   login,   newPassswordAfterOTPVerified,} from "../controllers/admin/admin-controller";
import { createEventHandler, getEventByIdHandler, updateEventHandler, deleteEventHandler, getAllEventsHandler } from '../controllers/events/events-controller';



// import { checkAdminAuth } from "../middleware/check-auth";
import { upload } from "../configF/multer";
import { checkMulter } from "../lib/errors/error-response-handler"
import { verifyOtpPasswordReset } from "src/controllers/user/user-controller";
import { checkAuth } from "src/middleware/check-auth";
// import passport from 'passport';
// import { loginController } from '../controllers/admin/admin-controller';

// const authController = new loginController();

// // Email login
// router.post('/auth/email/login',
//     passport.authenticate('local', { session: false }),
//     authController.emailLogin.bind(authController)
// );

// // Facebook routes
// router.get('/auth/facebook',
//     passport.authenticate('facebook', { scope: ['email'] })
// );
// router.get('/auth/facebook/callback',
//     passport.authenticate('facebook', { session: false }),
//     authController.socialCallback.bind(authController)
// );

// // Google routes
// router.get('/auth/google',
//     passport.authenticate('google', { scope: ['profile', 'email'] })
// );
// router.get('/auth/google/callback',
//     passport.authenticate('google', { session: false }),
//     authController.socialCallback.bind(authController)
// );

// // Apple routes
// router.get('/auth/apple',
//     passport.authenticate('apple', { scope: ['email', 'name'] })
// );
// router.get('/auth/apple/callback',
//     passport.authenticate('apple', { session: false }),
//     authController.socialCallback.bind(authController)
// );

// // WhatsApp routes
// router.get('/auth/whatsapp',
//     passport.authenticate('whatsapp', { scope: ['phone'] })
// );
// router.get('/auth/whatsapp/callback',
//     passport.authenticate('whatsapp', { session: false }),
//     authController.socialCallback.bind(authController)
// );



const router = Router();

router.post("/login", login)
router.post("/verify-otp", verifyOtpPasswordReset)
router.post("/forget-password", forgotPassword)
router.patch("/new-password-otp-verified", newPassswordAfterOTPVerified)
router.get("/", getAdminDetails)
router.get("/dashboard", getDashboardStats)

// get new users
router.get("/new-users",checkAuth, getNewUsers)


// events routes

router.post('/', createEventHandler);
router.get('/', getAllEventsHandler);
router.get('/:id', getEventByIdHandler);
router.put('/:id', updateEventHandler);
router.delete('/:id', deleteEventHandler);


export { router }