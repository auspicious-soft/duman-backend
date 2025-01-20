import { Router } from "express";
import { login, signup, forgotPassword, getUserInfo, editUserInfo, getUser, getAllUser } from "../controllers/user/user-controller";
import { checkAuth } from "src/middleware/check-auth";


const router = Router();


router.post("/signup", signup)
router.post("/login", login)
router.patch("/forgot-password", forgotPassword)
router.get("/:id", getUser)
router.get("/", getAllUser)
// router.get("/dashboard", checkAuth, getDashboardStats)
router.put("/", checkAuth, editUserInfo)



export { router }