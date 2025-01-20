import { Router } from "express";
import {  forgotPassword, getAdminDetails, getDashboardStats,   getNewUsers,   login,   newPassswordAfterOTPVerified,} from "../controllers/admin/admin-controller";
import { createEventHandler, getEventByIdHandler, updateEventHandler, deleteEventHandler, getAllEventsHandler } from '../controllers/events/events-controller';
import { createUser, deleteUser, getAllUser, getUser, updateUser, verifyOtpPasswordReset } from "src/controllers/user/user-controller";
import { checkAuth } from "src/middleware/check-auth";
import { createCategory, deleteCategory, getAllCategories, getCategory, updateCategory } from "src/controllers/categories/categories-controller";
import { createSubCategory, deleteSubCategory, getAllSubCategory, getSubCategoriesByCategoryId, getSubCategory, updateSubCategory } from "src/controllers/sub-categories/sub-categories-controller";
import { createBook, deleteBook, getAllBooks, getBook, updateBook } from "../controllers/Books/books-controller";
// import passport from 'passport';
// import { loginController } from '../controllers/admin/admin-controller();

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


router.get("/", getAdminDetails)
router.get("/dashboard", getDashboardStats)

// get new users
router.get("/new-users", getNewUsers)


// events routes

router.post('/events', createEventHandler);
router.get('/events', getAllEventsHandler);
router.get('/events/:id', getEventByIdHandler);
router.put('/events/:id', updateEventHandler);
router.delete('/events/:id', deleteEventHandler);

//categories routes

router.post('/categories', createCategory);
router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);


// sub-categories routes

router.post('/sub-categories', createSubCategory);
router.get('/sub-categories', getAllSubCategory);
router.get('/sub-categories/:id', getSubCategory);
router.put('/sub-categories/:id', updateSubCategory);
router.get('/:categoryId/sub-categories', getSubCategoriesByCategoryId);
router.delete('/sub-categories/:id', deleteSubCategory);

// books routes

router.post('/books', createBook);
router.get('/books', getAllBooks);
router.get('/books/:id', getBook);
router.put('/books/:id', updateBook);
router.delete('/books/:id', deleteBook);

// users route
router.post('/users', createUser);
router.get("/users", getAllUser)
router.get("/users/:id", getUser)
router.put("/users/:id", updateUser)
router.delete('/users/:id', deleteUser);

export { router }