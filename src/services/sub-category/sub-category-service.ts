import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { subCategoriesModel } from "../../models/sub-categories/sub-categories-schema";
import { productsModel } from "src/models/products/products-schema";
import { queryBuilder } from "src/utils";
import { categoriesModel } from "src/models/categories/categroies-schema";
import { deleteFileFromS3 } from "src/config/s3";


export const createSubCategoryService = async (payload: any, res: Response) => {
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

export const getSubCategoriesService = async (payload: any,id:string,res: Response) => {
    try {
        const subCategories = await subCategoriesModel.findById(id);
        const page = parseInt(payload.page as string) || 1;
        const limit = parseInt(payload.limit as string) || 0;
        const offset = (page - 1) * limit;
        const { query, sort } = queryBuilder(payload, ["name"]);
      
        const totalDataCount =
          Object.keys(query).length < 1
            ? await productsModel.countDocuments({ subCategoryId: id })
            : await productsModel.countDocuments({ ...query, subCategoryId: id });
      
        const books = await productsModel
          .find({ ...query, subCategoryId: id })
          .sort(sort)
          .skip(offset)
          .limit(limit)
          .select("-__v");
      
        if (!books || books.length === 0) {
          return errorResponseHandler("No blog found for this category", httpStatusCode.NO_CONTENT, res);
        }
      
        return {
          success: true,
          message: "Book live retrieved successfully",
          data: { subCategories, books },
          page,
          limit,
          total: totalDataCount,
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
        const books = await productsModel.find({ categoryId }).select("-__v").populate('authorId').lean();
        console.log('books: ', books);
        if ((!subCategories || subCategories.length === 0) && (!books || books.length === 0)) {
            return errorResponseHandler("No sub-categories and book found for this category", httpStatusCode.NO_CONTENT, res);
            
        }
        const response = subCategories.length > 0 ? subCategories : books;

        return {
            success: true,
            data:response,
        };
    
};

export const updateSubCategoryService = async (id: string, payload: any, res: Response) => {
        const updatedSubCategory = await subCategoriesModel.findByIdAndUpdate(id, payload, { new: true });
        if (!updatedSubCategory) return errorResponseHandler("Sub-category not found", httpStatusCode.NOT_FOUND, res);
        return {
            success: true,
            message: "Sub-category updated successfully",
            data: updatedSubCategory,
        };
 
};

export const deleteSubCategoryService = async (id: string, res: Response) => {
        const books = await productsModel.find({ subCategoryId: id });
        if (books.length > 0) return errorResponseHandler("Sub-category cannot be deleted because it has books", httpStatusCode.BAD_REQUEST, res);

        const deletedSubCategory = await subCategoriesModel.findByIdAndDelete(id).populate('categoryId');
        if (!deletedSubCategory) return errorResponseHandler("Sub-category not found", httpStatusCode.NOT_FOUND, res);
         if(deletedSubCategory?.image){
            await deleteFileFromS3(deletedSubCategory?.image)
          }
        return {
            success: true,
            message: "Sub-category deleted successfully",
            data: deletedSubCategory,
        };
 
};
