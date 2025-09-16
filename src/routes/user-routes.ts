import { Router } from "express";
import {
  getAllAuthorsForUser,
  getAuthorCountries,
  getAuthorForUser,
} from "src/controllers/authors/authors-controller";
import {
  getAllBookLivesForUser,
  getBLogById,
} from "src/controllers/book-lives/book-lives-controller";
import {
  getBookSchoolsByCode,
  verifyBookSchoolsByCode,
} from "src/controllers/book-schools/book-schools-controller";
import {
  getAllCategories,
  getBooksByCategoryId,
} from "src/controllers/categories/categories-controller";
import {
  getAllCollections,
  getCollectionForUser,
} from "src/controllers/collections/collections-controller";
import { verifyDiscountVoucher } from "src/controllers/discount-vouchers/discount-vouchers-controller";
import {
  getAllEventsHandler,
  getAllEventsHandlerForUser,
  getEventByIdHandler,
} from "src/controllers/events/events-controller";
import {
  getAllFavorites,
  getFavorite,
  updateFavorite,
} from "src/controllers/product-favorites/product-favorites-controller";
import {
  getAllNotificationsOfUser,
  markAllNotificationsAsRead,
} from "src/controllers/notifications/notifications-controller";
import {
  getAllAudioBookForUser,
  getAllBooks,
  getBestSellers,
  getBook,
  getBookforUser,
  getBookMarketForUser,
  getChaptersByAudiobookIDForUser,
  getCourseforUser,
  getNewbookForUser,
} from "src/controllers/products/products-controller";
import {
  getAllPublishers,
  getPublisherForUser,
  getPublisherWorkForUser,
} from "src/controllers/publisher/publishers-controller";
import {
  AddBookRating,
  getRating,
} from "src/controllers/rating/rating-controller";
import {
  generateCertificate,
  getAllReadProgressHandler,
  getCourseCertificateHandler,
  getReadProgressByIdHandler,
  updateCourseStatus,
  updateReadProgressHandler,
} from "src/controllers/read-progess/read-progress-controller";
import {
  getAllStories,
  getStory,
} from "src/controllers/stories/stories-controller";
import {
  getSubCategoriesByCategoryIdForUser,
  getSubCategoryforUser,
} from "src/controllers/sub-categories/sub-categories-controller";
import {
  getHomePageHandler,
  getproductsTabHandler,
} from "src/controllers/user-home-page/user-home-page-controller";
import {
  changePasswordUser,
  deleteUser,
  getCurrentUserDetails,
  getUserBadge,
  getUserDashboardStats,
  logoutUser,
  updateCurrentUserDetails,
  updateCurrentUserLanguage,
  uploadUserImageController,
} from "src/controllers/user/user-controller";
import {
  getAllAuthorFavorites,
  getAuthorFavorite,
  updateAuthorFavorite,
} from "src/controllers/author-favorites/author-favorites-controller";
import {
  getAllSummaries,
  getSummaryForUser,
} from "src/controllers/summaries/summaries-controller";
import {
  getBookStudyCategoriesStudy,
  getBookStudyForUser,
  getBookStudyNewbooks,
  getBookStudyReadProgress,
  getBookStudyTeachers,
  getPopularCourses,
} from "src/controllers/book-studies/book-studies-controller";
import {
  getBookMasterCategories,
  getBookMasterForUser,
  getBookMasterTeachers,
  getPopularCoursesBookMaster,
} from "src/controllers/book-masters/book-masters-controller";
import {
  getBookUniversityCategories,
  getBookUniversityForUser,
  getBookUniversityNewbooks,
  getBookUniversityReadProgress,
  getBookUniversityTeachers,
  getPopularCoursesBookUniversity,
} from "src/controllers/book-universities/book-universities-controller";
import {
  getAllFaviouriteBooks,
  getAllFinishedBooks,
  getAllReadingBooks,
  getCoursesForBookRoom,
} from "src/controllers/book-room/book-room-controller";
import { getAward } from "src/controllers/awards/awards-controller";
import {
  getCourseLesson,
  getCourseLessonForUser,
  updateCourseLesson,
} from "src/controllers/course-lessons/course-lessons-controller";
import {
  getAudiobookChapter,
  getAudiobookChaptersByProductId,
} from "src/controllers/audiobook-chapters/audiobook-chapters-controller";
import {
  createFreeProductOrder,
  createOrder,
  getAllOrders,
  getOrder,
  getWalletHistory,
  updateOrder,
} from "src/controllers/orders/orders-controller";
import {
  createOrAddToCartController,
  deleteCartController,
  getUserCartController,
  removeFromCartController,
} from "src/controllers/cart/cart-controller";
import { getSettings } from "src/controllers/settings/settings-controller";
import { createFAQ, deleteFAQ, getAllFAQ, updateFAQ } from "src/controllers/FAQs/FAQs-controller";

const router = Router();

router.get("/dashboard/:id", getUserDashboardStats);
router.delete("/delete-account", deleteUser);
router.put("/logout", logoutUser);

//book-events routes
router.get("/events", getAllEventsHandlerForUser);
router.get("/events/:id", getEventByIdHandler);

// book-lives route
router.get("/book-lives", getAllBookLivesForUser);
router.get("/book-lives/:id", getBLogById);

//rating route
router.put("/books/rating/:id", AddBookRating);
router.get("/books/rating/:id", getRating);

//coupon route
router.get("/book-schools/verify", verifyBookSchoolsByCode);
router.get("/book-schools/books", getBookSchoolsByCode);

//notifications route
router
  .route("/:id/notifications")
  .get(getAllNotificationsOfUser)
  .put(markAllNotificationsAsRead);

//home-page  route
router.route("/home-page").get(getHomePageHandler);
router.get("/home-page/products", getproductsTabHandler);

//stories route
router.get("/stories", getAllStories);
router.get("/stories/:id", getStory);

// books routes
router.get("/books", getAllBooks);
router.get("/new-books", getNewbookForUser);
router.get("/best-sellers", getBestSellers);
router.get("/audiobooks", getAllAudioBookForUser);
router.get("/books/:id", getBookforUser);
router.get("/audiobook/:id/chapters", getChaptersByAudiobookIDForUser);

// collections route
router.get("/collections", getAllCollections);
router.get("/collections/:id", getCollectionForUser);

// read-progress route
router.get("/read-progress", getAllReadProgressHandler);
router.get("/read-progress/:id", getReadProgressByIdHandler);
router.get("/certificate/:id", getCourseCertificateHandler);
router.put("/read-progress/:id", updateReadProgressHandler);

//favorites route
router.get("/favourites", getAllFavorites);
router.get("/favourites/:id", getFavorite);
router.put("/favourites", updateFavorite);

//author-favorites route
router.get("/author-favourites", getAllAuthorFavorites);
router.get("/author-favourites/:id", getAuthorFavorite);
router.put("/author-favourites", updateAuthorFavorite);

//voucher route
router.get("/vouchers/:id", verifyDiscountVoucher);

//book-masters route
router.get("/book-market", getBookMarketForUser);

//publishers route
router.get("/publishers", getAllPublishers);
router.get("/publishers/:id", getPublisherForUser);
router.get("/publishers/:id/work", getPublisherWorkForUser);

//categories routes
router.get("/categories", getAllCategories);
router.get("/categories/:id/products", getBooksByCategoryId);
router.get(
  "/categories/:categoryId/sub-categories",
  getSubCategoriesByCategoryIdForUser
);

//sub-categories routes
router.get("/sub-categories/:id", getSubCategoryforUser);

//author route
router.get("/authors", getAllAuthorsForUser);
router.get("/authors/:id", getAuthorForUser);
router.get("/author-countries", getAuthorCountries);

//summaries route
router.get("/summaries", getAllSummaries);
router.get("/summaries/:id", getSummaryForUser);

//books-studies route
router.get("/books-studies", getBookStudyForUser);
router.get("/books-studies/categories", getBookStudyCategoriesStudy);
router.get("/books-studies/teachers", getBookStudyTeachers);
router.get("/books-studies/popular-courses", getPopularCourses);
router.get("/books-studies/new-books", getBookStudyNewbooks);
router.get("/books-studies/read-progress", getBookStudyReadProgress);

//books-masters route
router.get("/books-masters", getBookMasterForUser);
router.get("/books-masters/categories", getBookMasterCategories);
router.get("/books-masters/speakers", getBookMasterTeachers);
router.get("/books-masters/popular-courses", getPopularCoursesBookMaster);
// router.get("/books-masters/new-books", getBookMasterNewbooks);
// router.get("/books-masters/read-progress", getBookMasterReadProgress);

//books-studies route
router.get("/books-universities", getBookUniversityForUser);
router.get("/books-universities/categories", getBookUniversityCategories);
router.get("/books-universities/speakers", getBookUniversityTeachers);
router.get(
  "/books-universities/popular-courses",
  getPopularCoursesBookUniversity
);
router.get("/books-universities/new-books", getBookUniversityNewbooks);
router.get("/books-universities/read-progress", getBookUniversityReadProgress);

//book-room route
router.get("/book-rooms/reading-now", getAllReadingBooks);
router.get("/book-rooms/finished-books", getAllFinishedBooks);
router.get("/book-rooms/favourite-books", getAllFaviouriteBooks);
router.get("/book-rooms/courses", getCoursesForBookRoom);

//awards route
router.get("/awards", getAward);

//change-password route
router.put("/change-password", changePasswordUser);

//user-details route
router.get("/user-details", getCurrentUserDetails);
router.put("/user-details", updateCurrentUserDetails);
router.put("/user-language", updateCurrentUserLanguage);
router.post("/upload-image", uploadUserImageController);
router.get("/get-badge", getUserBadge);

// course-lessons routes
router.get("/course-lessons", getAllBooks);
router.get("/course-lessons/:id", getCourseLessonForUser);
router.get("/course/:id", getCourseforUser);
router.put("/complete-course/:id", updateCourseStatus);

// audiobook-chapters routes
router.get("/audiobook-chapters/:id", getAudiobookChapter);
router.get(
  "/audiobook-chapters/product/:productId",
  getAudiobookChaptersByProductId
);

// order route
router.post("/order", createOrder);
router.get("/order", getAllOrders);
router.get("/order/:id", getOrder);
router.put("/order/:id", updateOrder);
router.post("/order/free-products", createFreeProductOrder);
router.get("/wallet-history", getWalletHistory);

// certificate route
router.post("/generate-certificate", generateCertificate);

// Cart Route
router.route("/cart")
  .post(createOrAddToCartController).get(getUserCartController).delete(deleteCartController);
router.patch("/cart/:id", removeFromCartController);

//Policies route
router.get("/policies", getSettings)

//FAQs route
router.route("/faqs").get(getAllFAQ);


export { router };
