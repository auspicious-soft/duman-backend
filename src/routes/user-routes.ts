import { Router } from "express";
import { getAllAuthors } from "src/controllers/authors/authors-controller";
import {  getAllBookLivesWithBlogs, getBookLive } from "src/controllers/book-lives/book-lives-controller";
import { getBookSchoolsByCode, verifyBookSchoolsByCode } from "src/controllers/book-schools/book-schools-controller";
import { getAllCollections, getCollection } from "src/controllers/collections/collections-controller";
import { getAllEventsHandler, getEventByIdHandler } from "src/controllers/events/events-controller";
import { createFavorite, deleteFavorite, getAllFavorites, getFavorite, updateFavorite } from "src/controllers/favorites/favorites-controller";
import { getAllNotificationsOfUser, markAllNotificationsAsRead } from "src/controllers/notifications/notifications-controller";
import { getAllBooks, getBook, getBookforUser } from "src/controllers/products/products-controller";
import { AddBookRating, getRating } from "src/controllers/rating/rating-controller";
import { getAllReadProgressHandler, getReadProgressByIdHandler, updateReadProgressHandler } from "src/controllers/read-progess/read-progress-controller";
import { getAllStories, getStory } from "src/controllers/stories/stories-controller";
import { getHomePageHandler, getproductsTabHandler } from "src/controllers/user-home-page/user-home-page-controller";
import {  getUserDashboardStats,  } from "src/controllers/user/user-controller";
import { getAllBookLivesWithBlogsService } from "src/services/book-lives/book-lives-service";


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
router.get("/books/:id", getBookforUser);

// collections route
router.get("/collections", getAllCollections);
router.get("/collections/:id", getCollection);

// read-progress route
router.get("/read-progress", getAllReadProgressHandler);
router.get("/read-progress/:id", getReadProgressByIdHandler);
router.put("/read-progress/:id", updateReadProgressHandler);

//author route
router.get("/authors", getAllAuthors);

//favorites route
// router.post("/favorites", createFavorite);
router.get("/favourites", getAllFavorites);
router.get("/favourites/:id", getFavorite);
router.put("/favourites", updateFavorite);
router.delete("/favourites/:id", deleteFavorite);

export { router }