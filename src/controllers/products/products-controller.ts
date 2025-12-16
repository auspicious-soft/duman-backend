import { Request, Response } from "express";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { createBookService, getBooksService, updateBookService, deleteBookService, getAllBooksService, addBookToDiscountsService, removeBookFromDiscountsService, getAllDiscountedBooksService, getBookForUserService, getBookMarketForUserService, getNewbookForUserService, getAllAudioBookForUserService, getCourseForUserService, getChaptersByAudiobookIDForUserService, getBestSellersService, getRelatedBooksService, getNewPodcastsService, getNewVideoLecturesService, getNewCoursesService, updateDiscountedBookService } from "../../services/products/products-service";

export const createBook = async (req: Request, res: Response) => {
  try {
    const response = await createBookService(req.body, res);
    return res.status(httpStatusCode.CREATED).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

export const getAllBooks = async (req: Request, res: Response) => {
  try {
    const response = await getAllBooksService(req.user, req.query, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getAllDiscountedBooks = async (req: Request, res: Response) => {
  try {
    const response = await getAllDiscountedBooksService(req.query, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};


export const getBook = async (req: Request, res: Response) => {
  try {
    const response = await getBooksService(req.query,req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getBookforUser = async (req: Request, res: Response) => {
  try {
    const response = await getBookForUserService(req.params.id,req.query,req.user, res);
    console.log('response: ', response);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getChaptersByAudiobookIDForUser = async (req: Request, res: Response) => {
  try {
    const response = await getChaptersByAudiobookIDForUserService(req.params.id,req.query,req.user, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getBestSellers = async (req: Request, res: Response) => {
  try {
    const response = await getBestSellersService(req.user,req.query, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getRelatedBooks = async (req: Request, res: Response) => {
  try {
    const response = await getRelatedBooksService(req.user,req.query, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getCourseforUser = async (req: Request, res: Response) => {
  try {
    const response = await getCourseForUserService(req.params.id,req.user, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const response = await updateBookService(req.params.id, req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

export const updateDiscountedBook = async (req: Request, res: Response) => {
  try {
    const response = await updateDiscountedBookService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};


export const addBookToDiscounts = async (req: Request, res: Response) => {
  try {
    const response = await addBookToDiscountsService( req.body, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

export const removeBookFromDiscounts = async (req: Request, res: Response) => {
  try {
    const response = await removeBookFromDiscountsService(req.body,  res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    const response = await deleteBookService(req.params.id, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};

export const getBookMarketForUser = async (req: Request, res: Response) => {
  try {
    const response = await getBookMarketForUserService(req.user,req.query, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getNewbookForUser = async (req: Request, res: Response) => {
  try {

    const response = await getNewbookForUserService(req.user,req.query, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getNewVideoLecturesForUser = async (req: Request, res: Response) => {
  try {

    const response = await getNewVideoLecturesService(req.user,req.query, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getNewPodcastsForUser = async (req: Request, res: Response) => {
  try {

    const response = await getNewPodcastsService(req.user,req.query, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getNewCoursesForUser = async (req: Request, res: Response) => {
  try {

    const response = await getNewCoursesService(req.user,req.query, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
export const getAllAudioBookForUser = async (req: Request, res: Response) => {
  try {

    const response = await getAllAudioBookForUserService(req.query,req.user, res);
    return res.status(httpStatusCode.OK).json(response);
  } catch (error: any) {
    const { code, message } = errorParser(error);
    return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
  }
};
