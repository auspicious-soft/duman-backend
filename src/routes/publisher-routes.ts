import { Router } from "express";
import { getAllBooksByPublisherId, getBookByIdPublisher } from "src/controllers/publisher/publishers-controller";

const router = Router();


router.get("/books", getAllBooksByPublisherId);
router.get("/books/:id", getBookByIdPublisher);
// router.get("/books/:id", getBlogById);
// router.put("/books/:id", updateBlog);
// router.delete("/books/:id", deleteBlog);


export { router };
