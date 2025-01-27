import { Router } from "express";
import { login, signup, forgotPassword, getUserInfo, editUserInfo, getUser, getAllUser, getUserDashboardStats,  } from "../controllers/user/user-controller";
import { checkAuth } from "src/middleware/check-auth";
import { AddBookRating } from "src/controllers/products/products-controller";


const router = Router();


router.post("/signup", signup)
router.post("/login", login)
router.patch("/forgot-password", forgotPassword)
router.get("/", getAllUser)
router.get("/:id", getUser)
router.get("/dashboard/:id", getUserDashboardStats)
router.put("/", checkAuth, editUserInfo)

//rating route
router.put("/books/rating/:id", AddBookRating);



export { router }