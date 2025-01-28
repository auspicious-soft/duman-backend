import { Router } from "express";
// import { login, signup, forgotPassword, getUserInfo, editUserInfo, getUser, getAllUser, getUserDashboardStats,  } from "../controllers/user/user-controller";
import { checkAuth } from "src/middleware/check-auth";
import { AddBookRating } from "src/controllers/products/products-controller";
import { emailSignin, emailSignup, getUserDashboardStats, sendWhatsAppOTP, verifyWhatsAppOTP } from "src/controllers/user/user-controller";


const router = Router();


// router.post("/signup", signup)
// router.post("/login", login)
// router.patch("/forgot-password", forgotPassword)
// router.get("/", getAllUser)
// router.get("/:id", getUser)
router.get("/dashboard/:id", getUserDashboardStats)
// router.put("/", checkAuth, editUserInfo)
router.post('/signup/email', emailSignup);
router.post('/signin/email', emailSignin);
router.post('/whatsapp/send-otp', sendWhatsAppOTP);
router.post('/whatsapp/verify-otp', verifyWhatsAppOTP);


//rating route
router.put("/books/rating/:id", AddBookRating);



export { router }