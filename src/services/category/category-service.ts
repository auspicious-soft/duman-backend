import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { categoriesModel } from "../../models/categories/categroies-schema";
import { subCategoriesModel } from "src/models/sub-categories/sub-categories-schema";
import { productsModel } from "src/models/products/products-schema";
import { queryBuilder } from "src/utils";
import { deleteFileFromS3 } from "src/config/s3";

export const createCategoryService = async (payload: any, res: Response) => {
  const newCategory = new categoriesModel(payload);
  const savedCategory = await newCategory.save();
  return {
    success: true,
    message: "Category created successfully",
    data: savedCategory,
  };
};

export const getCategoryService = async (id: string, res: Response) => {
  const category = await categoriesModel.findById(id);
  if (!category)
    return errorResponseHandler(
      "Category not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  return {
    success: true,
    message: "Category retrieved successfully",
    data: category,
  };
};
export const getAllCategoriesService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["name"]);

  const totalDataCount =
    Object.keys(query).length < 1
      ? await categoriesModel.countDocuments()
      : await categoriesModel.countDocuments(query);
  const results = await categoriesModel
    .find(query)
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .select("-__v");
  if (results.length)
    return {
      page,
      limit,
      success: true,
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      limit,
      success: false,
      total: 0,
    };
  }
};

export const updateCategoryService = async (
  id: string,
  payload: any,
  res: Response
) => {
  const updatedCategory = await categoriesModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedCategory)
    return errorResponseHandler(
      "Category not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  return {
    success: true,
    message: "Category updated successfully",
    data: updatedCategory,
  };
};

export const deleteCategoryService = async (id: string, res: Response) => {
  const subCategories = await subCategoriesModel.find({ categoryId: id });
  const books = await productsModel.find({ categoryId: id });
  if (subCategories.length > 0) {
    return errorResponseHandler(
      "Cannot delete category with existing sub-categories",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }
  if (books.length > 0) {
    return errorResponseHandler(
      "Cannot delete category with existing books",
      httpStatusCode.BAD_REQUEST,
      res
    );
  }
  const deletedCategory = await categoriesModel.findByIdAndDelete(id);
  if (!deletedCategory)
    return errorResponseHandler(
      "Category not found",
      httpStatusCode.NOT_FOUND,
      res
    );
  if(deletedCategory?.image){
    await deleteFileFromS3(deletedCategory?.image)
  }
  return {
    success: true,
    message: "Category deleted successfully",
    data: deletedCategory,
  };
};
