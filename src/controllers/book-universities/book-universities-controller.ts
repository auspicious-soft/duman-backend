import { Request, Response } from "express";
import { createBookUniversityService, getBookUniversityService, updateBookUniversityService, deleteBookUniversityService, getAllBookUniversitiesService } from "../../services/book-universities/book-universities-service";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";



export const createBookUniversity = async (req: Request, res: Response) => {
    try {
        const response = await createBookUniversityService(req.body, res);
        return res.status(httpStatusCode.CREATED).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};

export const getBookUniversity = async (req: Request, res: Response) => {
    try {
        const response = await getBookUniversityService(req.params.id, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};

export const updateBookUniversity = async (req: Request, res: Response) => {
    try {
        const response = await updateBookUniversityService(req.params.id, req.body, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};

export const deleteBookUniversity = async (req: Request, res: Response) => {
    try {
        const response = await deleteBookUniversityService(req.params.id, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "Failed to delete book university" });
    }
};

export const getAllBookUniversities = async (req: Request, res: Response) => {
    try {
        const response = await getAllBookUniversitiesService(req.query, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};
