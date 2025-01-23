import { Router } from "express";
import { forgotPassword, getAdminDetails, getDashboardStats, getNewUsers, login, newPassswordAfterOTPVerified } from "../controllers/admin/admin-controller";
import { createEventHandler, getEventByIdHandler, updateEventHandler, deleteEventHandler, getAllEventsHandler } from "../controllers/events/events-controller";
import { createUser, deleteUser, getAllUser, getUser, getUserDashboardStats, updateUser, verifyOtpPasswordReset } from "src/controllers/user/user-controller";
import { checkAuth } from "src/middleware/check-auth";
import { createCategory, deleteCategory, getAllCategories, getCategory, updateCategory } from "src/controllers/categories/categories-controller";
import { createSubCategory, deleteSubCategory, getAllSubCategory, getSubCategoriesByCategoryId, getSubCategory, updateSubCategory } from "src/controllers/sub-categories/sub-categories-controller";
import { addBookToDiscounts, createBook, deleteBook, getAllBooks, getAllDiscountedBooks, getBook, removeBookFromDiscounts, updateBook } from "../controllers/products/products-controller";
import { createOrder, deleteOrder, getAllOrders, getOrder, updateOrder } from "src/controllers/orders/orders-controller";
import { createPublisher, deletePublisher, getAllPublishers, getPublisher, updatePublisher } from "src/controllers/publisher/publishers-controller";
import { createAuthor, deleteAuthor, getAllAuthors, getAuthor, updateAuthor } from "src/controllers/authors/authors-controller";
import { createAuthorService } from "src/services/authors/authors-service";
import { createStory, deleteStory, getAllStories, getStory, updateStory } from "src/controllers/stories/stories-controller";
import { createBanner, deleteBanner, getAllBanners, getBanner, updateBanner } from "src/controllers/banners/banners-controller";
import { addBooksToCollection, createCollection, deleteCollection, getAllCollections, getCollection, updateCollection } from "src/controllers/collections/collections-controller";
import { addBooksToSummary, createSummary, deleteSummary, getAllSummaries, getSummary, updateSummary } from "src/controllers/summaries/summaries-controller";
import { addBookToDiscountsService, getAllDiscountedBooksService } from "src/services/products/products-service";
import { createDiscountVoucher, deleteDiscountVoucher, getAllDiscountVouchers, getDiscountVoucher, updateDiscountVoucher } from "src/controllers/discount-vouchers/discount-vouchers-controller";
import { createBookSchool, deleteBookSchool, getAllBookSchools, getBookSchool, updateBookSchool } from "src/controllers/book-schools/book-schools-controller";
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

router.get("/", getAdminDetails);
router.get("/dashboard", getDashboardStats);

//users routes
router.get("/new-users", getNewUsers);
// router.get("/", getNewUsers)
router.get("/user/:id", getUserDashboardStats);

// events routes

router.post("/events", createEventHandler);
router.get("/events", getAllEventsHandler);
router.get("/events/:id", getEventByIdHandler);
router.put("/events/:id", updateEventHandler);
router.delete("/events/:id", deleteEventHandler);

//categories routes

router.post("/categories", createCategory);
router.get("/categories", getAllCategories);
router.get("/categories/:id", getCategory);
router.get("/categories/:categoryId/sub-categories", getSubCategoriesByCategoryId);
router.put("/categories/:id", updateCategory);
router.delete("/categories/:id", deleteCategory);

// sub-categories routes

router.post("/sub-categories", createSubCategory);
router.get("/sub-categories", getAllSubCategory);
router.get("/sub-categories/:id", getSubCategory);
router.put("/sub-categories/:id", updateSubCategory);
router.delete("/sub-categories/:id", deleteSubCategory);

// books routes
router.post("/books", createBook);
router.get("/books", getAllBooks);
router.get("/books/:id", getBook);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);
 
// discounted-books route
router.get("/discounted-books", getAllDiscountedBooks);

// booksToDiscount routes
router.put("/booksToDiscount", addBookToDiscounts);
router.put("/removeBooksFromDiscounts", removeBookFromDiscounts);

// users route
router.post("/users", createUser);
router.get("/users", getAllUser);
router.get("/users/:id", getUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// order route
router.post("/order", createOrder);
router.get("/order", getAllOrders);
router.get("/order/:id", getOrder);
router.put("/order/:id", updateOrder);
router.delete("/order/:id", deleteOrder);

// publishers route
router.post("/publishers", createPublisher);
router.get("/publishers", getAllPublishers);
router.get("/publishers/:id", getPublisher);
router.put("/publishers/:id", updatePublisher);
router.delete("/publishers/:id", deletePublisher);

// authors route
router.post("/authors", createAuthor);
router.get("/authors", getAllAuthors);
router.get("/authors/:id", getAuthor);
router.put("/authors/:id", updateAuthor);
router.delete("/authors/:id", deleteAuthor);

// stories route
router.post("/stories", createStory);
router.get("/stories", getAllStories);
router.get("/stories/:id", getStory);
router.put("/stories/:id", updateStory);
router.delete("/stories/:id", deleteStory);

// banners route
router.post("/banners", createBanner);
router.get("/banners", getAllBanners);
router.get("/banners/:id", getBanner);
router.put("/banners/:id", updateBanner);
router.delete("/banners/:id", deleteBanner);

// collections route
router.post("/collections", createCollection);
router.get("/collections", getAllCollections);
router.get("/collections/:id", getCollection);
router.put("/collections/:id", updateCollection);
router.put("/collections/:id/books", addBooksToCollection);
router.delete("/collections/:id", deleteCollection);

// summaries route
router.post("/summaries", createSummary);
router.get("/summaries", getAllSummaries);
router.get("/summaries/:id", getSummary);
router.put("/summaries/:id", updateSummary);
router.put("/summaries/:id/books", addBooksToSummary);
router.delete("/summaries/:id", deleteSummary);

// discount-vouchers route
router.post("/vouchers", createDiscountVoucher);
router.get("/vouchers", getAllDiscountVouchers);
router.get("/vouchers/:id", getDiscountVoucher);
router.put("/vouchers/:id", updateDiscountVoucher);
router.delete("/vouchers/:id", deleteDiscountVoucher);

// book-schools route
router.post("/book-schools", createBookSchool);
router.get("/book-schools", getAllBookSchools);
router.get("/book-schools/:id", getBookSchool);
router.put("/book-schools/:id", updateBookSchool);
router.delete("/book-schools/:id", deleteBookSchool);


export { router };
