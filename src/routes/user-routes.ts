import { Router } from "express";
// import { login, signup, forgotPassword, getUserInfo, editUserInfo, getUser, getAllUser, getUserDashboardStats,  } from "../controllers/user/user-controller";
import { checkAuth } from "src/middleware/check-auth";
import { AddBookRating } from "src/controllers/products/products-controller";
import {  getUserDashboardStats,  } from "src/controllers/user/user-controller";


const router = Router();



router.get("/dashboard/:id", getUserDashboardStats);


//rating route
router.put("/books/rating/:id", AddBookRating);



export { router }