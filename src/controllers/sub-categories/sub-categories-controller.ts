import { Request, Response } from "express"
import { errorParser } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { 
    createSubCategoryService, 
    getSubCategoriesService, 
    updateSubCategoryService, 
    deleteSubCategoryService, 
    getAllSubCategoriesService
} from "../../services/sub-category/sub-category-service";


export const createSubCategory = async (req: Request, res: Response) => {
    try {
        const response = await createSubCategoryService(req.body, res);
        return res.status(httpStatusCode.CREATED).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const getAllSubCategory = async (req: Request, res: Response) => {
    try {
        const response = await getAllSubCategoriesService(res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}
export const getSubCategory = async (req: Request, res: Response) => {
    try {
        const response = await getSubCategoriesService(req.params.id,res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const updateSubCategory = async (req: Request, res: Response) => {
    try {
        const response = await updateSubCategoryService(req.params.id, req.body, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}

export const deleteSubCategory = async (req: Request, res: Response) => {
    try {
        const response = await deleteSubCategoryService(req.params.id, res);
        return res.status(httpStatusCode.OK).json(response);
    } catch (error: any) {
        const { code, message } = errorParser(error);
        return res.status(code || httpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: message || "An error occurred" });
    }
}
