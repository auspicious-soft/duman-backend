import { Request, Response } from "express"
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { 
    createBookService, 
    getBooksService, 
    updateBookService, 
    deleteBookService, 
    getAllBooksService
} from "../../services/products/products-service";


export const createBook = async (req: Request, res: Response) => {
    try {
        const response = await createBookService(req.body, res);
        return res.status(httpStatusCode.CREATED).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const getAllBooks = async (req: Request, res: Response) => {
    try {
        const response = await getAllBooksService(req.query,res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const getBook = async (req: Request, res: Response) => {
    try {
        const response = await getBooksService(req.params.id, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const updateBook = async (req: Request, res: Response) => {
    try {
        const response = await updateBookService(req.params.id, req.body, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const deleteBook = async (req: Request, res: Response) => {
    try {
        const response = await deleteBookService(req.params.id, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}
