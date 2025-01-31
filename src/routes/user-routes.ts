import { Router } from "express";
import { getAllBookLives, getBookLive } from "src/controllers/book-lives/book-lives-controller";
import { getAllEventsHandler, getEventByIdHandler } from "src/controllers/events/events-controller";
import { getAllNotificationsOfUser, markAllNotificationsAsRead } from "src/controllers/notifications/notifications-controller";
import { AddBookRating } from "src/controllers/products/products-controller";
import {  getUserDashboardStats,  } from "src/controllers/user/user-controller";


const router = Router();



router.get("/dashboard/:id", getUserDashboardStats);

//book-events routes
router.get("/events", getAllEventsHandler);
router.get("/events/:id", getEventByIdHandler);

// book-lives route
router.get("/book-lives", getAllBookLives);
router.get("/book-lives/:id", getBookLive);



//rating route
router.put("/books/rating/:id", AddBookRating);

//notifications route
router.route("/:id/notifications").get( getAllNotificationsOfUser).put( markAllNotificationsAsRead)


export { router }