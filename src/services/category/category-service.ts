import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { categoriesModel } from "../../models/categories/categroies-schema";

export const createCategoryService = async (payload: any, res: Response) => {
    console.log('payload: ', payload);
    try {
        const newCategory = new categoriesModel(payload);
        const savedCategory = await newCategory.save();
        return {
            success: true,
            message: "Category created successfully",
            data: savedCategory,
        };
    } catch (error) {
        console.log('error: ', error);
        return errorResponseHandler('Failed to create category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};

export const getCategoryService = async (id: string, res: Response) => {
    try {
        const category = await categoriesModel.findById(id);
        if (!category) return errorResponseHandler("Category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Category retrieved successfully",
            data: category,
        };
    } catch (error) {
        return errorResponseHandler('Failed to fetch category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};
export const getAllCategoriesService = async ( res: Response) => {
    try {
        const category = await categoriesModel.find();
        if (!category) return errorResponseHandler("Category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Category retrieved successfully",
            data: category,
        };
    } catch (error) {
        return errorResponseHandler('Failed to fetch category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};

export const updateCategoryService = async (id: string, payload: any, res: Response) => {
    try {
        const updatedCategory = await categoriesModel.findByIdAndUpdate(id, payload, { new: true });
        if (!updatedCategory) return errorResponseHandler("Category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Category updated successfully",
            data: updatedCategory,
        };
    } catch (error) {
        return errorResponseHandler('Failed to update category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};

export const deleteCategoryService = async (id: string, res: Response) => {
    try {
        const deletedCategory = await categoriesModel.findByIdAndDelete(id);
        if (!deletedCategory) return errorResponseHandler("Category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Category deleted successfully",
            data: deletedCategory,
        };
    } catch (error) {
        return errorResponseHandler('Failed to delete category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};
