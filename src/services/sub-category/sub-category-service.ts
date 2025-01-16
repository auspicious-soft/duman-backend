import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { subCategoriesModel } from "../../models/sub-categories/sub-categories-schema";
import { booksModel } from "src/models/books/books-schema";
import { queryBuilder } from "src/utils";
import { categoriesModel } from "src/models/categories/categroies-schema";


export const createSubCategoryService = async (payload: any, res: Response) => {
    console.log('payload: ', payload);
    const isCategory = await categoriesModel.findOne({ _id: payload.categoryId });
    if (!isCategory) {
        return errorResponseHandler("Category not found", httpStatusCode.NOT_FOUND, res);
    }
        const newSubCategory = new subCategoriesModel(payload);
        const savedSubCategory = await newSubCategory.save();
        return {
            success: true,
            message: "Sub-category created successfully",
            data: savedSubCategory,
        };
    
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
export const getAllSubCategoriesService = async (payload:any, res: Response) => {

    const page = parseInt(payload.page as string) || 1
      const limit = parseInt(payload.limit as string) || 0
      const offset = (page - 1) * limit
      const { query, sort } = queryBuilder(payload, ['name'])
     
      const totalDataCount = Object.keys(query).length < 1 ? await subCategoriesModel.countDocuments() : await subCategoriesModel.countDocuments(query)
      const results = await subCategoriesModel.find(query).sort(sort).skip(offset).limit(limit).populate('categoryId');
      console.log('results: ', results);
      if (results.length) return {
          page,
          limit,
          success: true,
          total: totalDataCount,
          data: results
      }
      else {
          return {
              data: [],
              page,
              limit,
              success: false,
              total: 0
          }
      }
};
 
export const getSubCategoriesByCategoryIdService = async (categoryId: string, res: Response) => {
        const subCategories = await subCategoriesModel.find({ categoryId }).select("-__v").populate('categoryId').lean();
        if (!subCategories || subCategories.length === 0) {
            return errorResponseHandler("No sub-categories found for this category", httpStatusCode.NOT_FOUND, res);
        }
        return {
            success: true,
            data: subCategories,
        };
    
};
export const getSubCategoryByIdService = async (id: string, res: Response) => {
    try {
        const subCategory = await subCategoriesModel.findById( id ).select("-__v").populate('categoryId').lean()
        if (!subCategory) return errorResponseHandler("Sub-category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            data: subCategory,
        };
    } catch (error) {
        console.error('Error fetching sub-category:', error); // Log the error for debugging
        return errorResponseHandler('Failed to fetch sub-category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    }
};
export const updateSubCategoryService = async (id: string, payload: any, res: Response) => {
    // try {
        const updatedSubCategory = await subCategoriesModel.findByIdAndUpdate(id, payload, { new: true });
        if (!updatedSubCategory) return errorResponseHandler("Sub-category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Sub-category updated successfully",
            data: updatedSubCategory,
        };
    // } catch (error) {
    //     return errorResponseHandler('Failed to update sub-category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    // }
};

export const deleteSubCategoryService = async (id: string, res: Response) => {
    // try {
        const books = await booksModel.find({ subCategoryId: id });
        if (books.length > 0) return errorResponseHandler("Sub-category cannot be deleted because it has books", httpStatusCode.BAD_REQUEST, res);

        const deletedSubCategory = await subCategoriesModel.findByIdAndDelete(id).populate('categoryId');
        if (!deletedSubCategory) return errorResponseHandler("Sub-category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Sub-category deleted successfully",
            data: deletedSubCategory,
        };
    // } catch (error) {
    //     return errorResponseHandler('Failed to delete sub-category', httpStatusCode.INTERNAL_SERVER_ERROR, res);
    // }
};
