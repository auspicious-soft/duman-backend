
import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { subCategoriesModel } from "../../models/sub-categories/sub-categories-schema";


export const createSubCategoryService = async (payload: any, res: Response) => {
    try {
        const newSubCategory = new subCategoriesModel(payload);
        const savedSubCategory = await newSubCategory.save();
        return {
            success: true,
            message: "Sub-category created successfully",
            data: savedSubCategory,
        };
    } catch (error) {
        return errorResponseHandler('Failed to create sub-category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};

export const getSubCategoriesService = async (id: string,res: Response) => {
    try {
        const subCategories = await subCategoriesModel.findById(id);
        return {
            success: true,
            data: subCategories,
        };
    } catch (error) {
        return errorResponseHandler('Failed to fetch sub-categories', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};
export const getAllSubCategoriesService = async (res: Response) => {
    try {
        const subCategories = await subCategoriesModel.find();
        return {
            success: true,
            data: subCategories,
        };
    } catch (error) {
        return errorResponseHandler('Failed to fetch sub-categories', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};

export const getSubCategoryByIdService = async (id: string, res: Response) => {
    try {
        const subCategory = await subCategoriesModel.findById(id);
        if (!subCategory) return errorResponseHandler("Sub-category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            data: subCategory,
        };
    } catch (error) {
        return errorResponseHandler('Failed to fetch sub-category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};

export const updateSubCategoryService = async (id: string, payload: any, res: Response) => {
    try {
        const updatedSubCategory = await subCategoriesModel.findByIdAndUpdate(id, payload, { new: true });
        if (!updatedSubCategory) return errorResponseHandler("Sub-category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Sub-category updated successfully",
            data: updatedSubCategory,
        };
    } catch (error) {
        return errorResponseHandler('Failed to update sub-category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};

export const deleteSubCategoryService = async (id: string, res: Response) => {
    try {
        const deletedSubCategory = await subCategoriesModel.findByIdAndDelete(id);
        if (!deletedSubCategory) return errorResponseHandler("Sub-category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Sub-category deleted successfully",
            data: deletedSubCategory,
        };
    } catch (error) {
        return errorResponseHandler('Failed to delete sub-category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};
