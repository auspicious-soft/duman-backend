import { Router } from "express";
import { getAllAuthors, getAllAuthorsForUser, getAuthor, getAuthorCountries, getAuthorForUser } from "src/controllers/authors/authors-controller";
import {  getAllBookLivesWithBlogs, getBookLive } from "src/controllers/book-lives/book-lives-controller";
import { getBookSchoolsByCode, verifyBookSchoolsByCode } from "src/controllers/book-schools/book-schools-controller";
import { getAllCategories, getBooksByCategoryId } from "src/controllers/categories/categories-controller";
import { getAllCollections, getCollection, getCollectionForUser } from "src/controllers/collections/collections-controller";
import { getDiscountVoucher, verifyDiscountVoucher } from "src/controllers/discount-vouchers/discount-vouchers-controller";
import { getAllEventsHandler, getEventByIdHandler } from "src/controllers/events/events-controller";
import { createFavorite, deleteFavorite, getAllFavorites, getFavorite, updateFavorite } from "src/controllers/product-favorites/product-favorites-controller";
import { getAllNotificationsOfUser, markAllNotificationsAsRead } from "src/controllers/notifications/notifications-controller";
import { getAllAudioBookForUser, getAllBooks, getBook, getBookforUser, getBookMarketForUser, getNewbookForUser } from "src/controllers/products/products-controller";
import { getAllPublishers, getPublisher, getPublisherForUser, getPublisherWorkForUser } from "src/controllers/publisher/publishers-controller";
import { AddBookRating, getRating } from "src/controllers/rating/rating-controller";
import { getAllReadProgressHandler, getReadProgressByIdHandler, updateReadProgressHandler } from "src/controllers/read-progess/read-progress-controller";
import { getAllStories, getStory } from "src/controllers/stories/stories-controller";
import { getSubCategoriesByCategoryId, getSubCategoriesByCategoryIdForUser, getSubCategory, getSubCategoryforUser } from "src/controllers/sub-categories/sub-categories-controller";
import { getHomePageHandler, getproductsTabHandler } from "src/controllers/user-home-page/user-home-page-controller";
import {  getUserDashboardStats,  } from "src/controllers/user/user-controller";
import { getAllBookLivesWithBlogsService } from "src/services/book-lives/book-lives-service";
import { getAllAuthorFavorites, getAuthorFavorite, updateAuthorFavorite } from "src/controllers/author-favorites/author-favorites-controller";
import { getAllSummaries, getSummaryForUser } from "src/controllers/summaries/summaries-controller";


const router = Router();

router.get("/dashboard/:id", getUserDashboardStats);

//book-events routes
router.get("/events", getAllEventsHandler);
router.get("/events/:id", getEventByIdHandler);

// book-lives route
router.get("/book-lives", getAllBookLivesWithBlogs);
router.get("/book-lives/:id", getBookLive);

//rating route
router.put("/books/rating/:id", AddBookRating);
router.get("/books/rating/:id", getRating);

//coupon route
router.get("/book-schools/verify", verifyBookSchoolsByCode);
router.get("/book-schools/books", getBookSchoolsByCode);

//notifications route
router.route("/:id/notifications").get( getAllNotificationsOfUser).put( markAllNotificationsAsRead)

//home-page  route
router.route("/home-page").get( getHomePageHandler)
router.get("/home-page/products", getproductsTabHandler)

//stories route
router.get("/stories", getAllStories);
router.get("/stories/:id", getStory);

// books routes
router.get("/books", getAllBooks);
router.get("/new-books", getNewbookForUser);
router.get("/audiobooks", getAllAudioBookForUser);
router.get("/books/:id", getBookforUser);

// collections route
router.get("/collections", getAllCollections);
router.get("/collections/:id", getCollectionForUser);

// read-progress route
router.get("/read-progress", getAllReadProgressHandler);
router.get("/read-progress/:id", getReadProgressByIdHandler);
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
router.get("/categories/:categoryId/sub-categories", getSubCategoriesByCategoryIdForUser);

//sub-categories routes
router.get("/sub-categories/:id", getSubCategoryforUser);

//author route
router.get("/authors", getAllAuthorsForUser);
router.get("/authors/:id", getAuthorForUser);
router.get("/author-countries", getAuthorCountries);

//summaries route
router.get("/summaries", getAllSummaries);
router.get("/summaries/:id", getSummaryForUser);

export { router }