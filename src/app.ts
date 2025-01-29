import express from "express"
import cors from "cors"
// import cookieParser from "cookie-parser";
import path from "path"
import { fileURLToPath } from 'url'
import connectDB from "./configF/db"
import { admin, publisher, user } from "./routes"
// import admin from "firebase-admin"
import { checkValidAdminRole, checkValidPublisherRole } from "./utils"
import bodyParser from 'body-parser'
import { login, newPassswordAfterOTPVerified } from "./controllers/admin/admin-controller"
import { forgotPassword } from "./controllers/admin/admin-controller"
import {  verifyOtpPasswordReset, forgotPasswordUser, newPassswordAfterOTPVerifiedUser, emailSignup, emailSignin, SignUpWithWhatsapp, verifyOTP } from "./controllers/user/user-controller";
import { checkAuth } from "./middleware/check-auth"

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url) // <-- Define __filename
const __dirname = path.dirname(__filename)        // <-- Define __dirname
// const serviceAccount = require(path.join(__dirname, 'config/firebase-adminsdk.json'));

const PORT = process.env.PORT || 8000
const app = express()

app.use(express.json());
app.set("trust proxy", true)
app.use(bodyParser.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
// app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

app.use(
    cors({
        origin: "*",
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
        credentials: true,
    })
);


var dir = path.join(__dirname, 'static')
app.use(express.static(dir))

var uploadsDir = path.join(__dirname, 'uploads')
app.use('/uploads', express.static(uploadsDir))


connectDB();


app.get("/", (_, res: any) => {
    res.send("Hello world entry point 🚀✅");
});

app.use("/api/admin",checkValidAdminRole, admin);
app.use("/api/publisher",checkValidPublisherRole, publisher);
app.use("/api/user", user);
app.post("/api/login", login)
app.post("/api/verify-otp", verifyOtpPasswordReset)
app.post("/api/forgot-password", forgotPassword)
app.patch("/api/new-password-otp-verified", newPassswordAfterOTPVerified)
app.post("/api/login/email", emailSignin)
app.post("/api/signup/email", emailSignup)
app.post("/api/login/whatsapp", SignUpWithWhatsapp)
app.post("/api/signup/whatsapp", verifyOTP)
app.post("/api/app/forgot-password", forgotPasswordUser)
app.patch("/api/app/new-password-otp-verified", newPassswordAfterOTPVerifiedUser)


app.listen(PORT, () => console.log(`Server is listening on port ${PORT}`));
