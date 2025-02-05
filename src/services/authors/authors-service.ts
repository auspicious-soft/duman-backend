import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { categoriesModel } from "../../models/categories/categroies-schema";
import { subCategoriesModel } from "src/models/sub-categories/sub-categories-schema";
import { productsModel } from "src/models/products/products-schema";
import { nestedQueryBuilder, queryBuilder } from "src/utils";
import { publishersModel } from "../../models/publishers/publishers-schema";
import { authorsModel } from "../../models/authors/authors-schema";
import { deleteFileFromS3 } from "src/config/s3";

export const createAuthorService = async (payload: any, res: Response) => {
  const newAuthor = new authorsModel(payload);
  const savedAuthor = await newAuthor.save();
  return {
    success: true,
    message: "Author created successfully",
    data: savedAuthor,
  };
};

export const getAuthorService = async (id: string, res: Response) => {
  const author = await authorsModel.findById(id);
  if (!author) return errorResponseHandler("Author not found", httpStatusCode.NOT_FOUND, res);
  const authorBooks = await productsModel.find({ authorId: id }).populate([{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }]);
  return {
    success: true,
    message: "Author retrieved successfully",
    data: author,
    authorBooks,
  };
};

export const getAllAuthorsService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys(query).length < 1 ? await authorsModel.countDocuments() : await authorsModel.countDocuments(query);
  const results = await authorsModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
  if (results.length)
    return {
      success: true,
      message: "Authors retrieved successfully",
      page,
      limit,
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

export const updateAuthorService = async (id: string, payload: any, res: Response) => {
  const updatedAuthor = await authorsModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedAuthor) return errorResponseHandler("Author not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Author updated successfully",
    data: updatedAuthor,
  };
};

export const deleteAuthorService = async (id: string, res: Response) => {
  const deletedAuthor = await authorsModel.findByIdAndDelete(id);
  if (!deletedAuthor) return errorResponseHandler("Author not found", httpStatusCode.NOT_FOUND, res);
  await deleteFileFromS3(deletedAuthor?.image);
  return {
    success: true,
    message: "Author deleted successfully",
    data: deletedAuthor,
  };
};
