import { Router } from "express";
import { login, signup, forgotPassword, getDashboardStats, getUserInfo, editUserInfo } from "../controllers/user/user-controller";
import { checkAuth } from "src/middleware/check-auth";


const router = Router();


router.post("/signup", signup)
router.post("/login", login)
router.patch("/forgot-password", forgotPassword)
router.get("/dashboard", checkAuth, getDashboardStats)
router.get("/:id")
// router.get(, getUserInfo)
// router.put(checkAuth, editUserInfo)



export { router }