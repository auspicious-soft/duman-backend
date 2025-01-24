import { Request, Response } from "express";
import { createBookStudyService, getBookStudyService, updateBookStudyService, deleteBookStudyService, getAllBookStudiesService } from "../../services/book-studies/book-studies-service";
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";




export const createBookStudy = async (req: Request, res: Response) => {
    try {
        const response = await createBookStudyService(req.body, res);
        return res.status(httpStatusCode.CREATED).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};

export const getBookStudy = async (req: Request, res: Response) => {
    try {
        const response = await getBookStudyService(req.params.id, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};

export const updateBookStudy = async (req: Request, res: Response) => {
    try {
        const response = await updateBookStudyService(req.params.id, req.body, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};

export const deleteBookStudy = async (req: Request, res: Response) => {
    try {
        const response = await deleteBookStudyService(req.params.id, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "Failed to delete book study" });
    }
};

export const getAllBookStudies = async (req: Request, res: Response) => {
    try {
        const response = await getAllBookStudiesService(req.query, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
};
