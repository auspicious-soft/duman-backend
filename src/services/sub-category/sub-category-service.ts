import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { subCategoriesModel } from "../../models/sub-categories/sub-categories-schema";
import { productsModel } from "src/models/products/products-schema";
import { nestedQueryBuilder, queryBuilder } from "src/utils";
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

export const getSubCategoriesService = async (payload: any, id: string, res: Response) => {
  try {
    const subCategories = await subCategoriesModel.findById(id);
    if (!subCategories) {
      return errorResponseHandler("No sub-categories", httpStatusCode.NO_CONTENT, res);
    }
    const page = parseInt(payload.page as string) || 1;
    const limit = parseInt(payload.limit as string) || 0;
    const offset = (page - 1) * limit;
    const { query, sort } = nestedQueryBuilder(payload, ["name"]);

    const totalDataCount = Object.keys(query).length < 1 ? await productsModel.countDocuments({ subCategoryId: id }) : await productsModel.countDocuments({ ...query, subCategoryId: id });

    const books = await productsModel
      .find({ ...query, subCategoryId: id })
      .sort(sort)
      .skip(offset)
      .limit(limit)
      .select("-__v")
      .populate("authorId");

    if (!books || books.length === 0) {
      return errorResponseHandler("No blog found for this category", httpStatusCode.NO_CONTENT, res);
    }

    return {
      success: true,
      message: "Sub categories retrieved successfully",
      data: { subCategories, books },
      page,
      limit,
      total: totalDataCount,
    };
  } catch (error) {
    return errorResponseHandler("Failed to fetch sub-categories", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};

export const getAllSubCategoriesService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys(query).length < 1 ? await subCategoriesModel.countDocuments() : await subCategoriesModel.countDocuments(query);
  const results = await subCategoriesModel.find(query).sort(sort).skip(offset).limit(limit).populate("categoryId");
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



// export const getSubCategoriesByCategoryIdService = async (payload: any, categoryId: string, res: Response) => {
//   console.log('payload: ', payload);
//   const page = parseInt(payload.page as string) || 1;
//   const limit = parseInt(payload.limit as string) || 0;
//   const offset = (page - 1) * limit;
//   const { query, sort } = nestedQueryBuilder(payload, ["name"]);

//   // Fetch sub-categories with pagination if necessary
//   const subCategoriesQuery = {  categoryId: categoryId,...query, };
//   console.log('subCategoriesQuery: ', subCategoriesQuery);
//   const subCategoriesLength = subCategoriesQuery ? await subCategoriesModel.countDocuments(subCategoriesQuery) : 0;
//   const subCategories:any[] = subCategoriesQuery
//     ? await subCategoriesModel
//         .find(subCategoriesQuery)
//         .sort(sort)
//         .skip(subCategoriesLength > 0 ? offset : 0) // Apply pagination only when subCategories are not empty
//         .limit(subCategoriesLength > 0 ? limit : 0) // Apply limit only when subCategories are not empty
//         .select("-__v")
//         .populate("categoryId")
//         .lean()
//     : [];

//   // Fetch books with pagination
//   const booksQuery = { ...query, categoryId: categoryId };
//   const books = await productsModel
//     .find(booksQuery)
//     .sort(sort)
//     .skip(subCategoriesLength === 0 ? offset : 0) // Apply pagination only if subCategories are empty
//     .limit(subCategoriesLength === 0 ? limit : 0) // Apply limit only if subCategories are empty
//     .select("-__v")
//     .populate("authorId");

//   if (subCategories.length > 0 && (!books || books.length === 0)) {
//     return errorResponseHandler("No blog found for this category", httpStatusCode.NO_CONTENT, res);
//   }
//   if (subCategories.length === 0 && books.length === 0) {
//     return errorResponseHandler("No sub-categories and book found for this category", httpStatusCode.NO_CONTENT, res);
//   }

//   const response = subCategories.length > 0 ? { subcategory: subCategories, books: [] } : { subcategory: [], books: books };

//   // If sub-categories are available, count documents for both sub-categories and books
//   const totalDataCount = subCategories.length < 0 
//     ? (Object.keys(query).length < 1 ? await productsModel.countDocuments({ categoryId: categoryId }) : await productsModel.countDocuments({ ...query, categoryId: categoryId }))
//     : (Object.keys(query).length < 1 ? await subCategoriesModel.countDocuments({ categoryId: categoryId }) : await subCategoriesModel.countDocuments({ ...query, categoryId: categoryId }));
//   return {
//     success: true,
//     message: "Sub categories retrieved successfully",
//     data: response,
//     page,
//     limit,
//     total: totalDataCount,
//   };
// };


export const getSubCategoriesByCategoryIdService = async (payload: any, categoryId: string, res: Response) => {
  console.log('payload: ', payload);
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]); 

  // Construct query for sub-categories
  const subCategoriesQuery = { ...query, categoryId: categoryId }; 

  // Get sub-categories with pagination
  const subCategories = await subCategoriesModel
    .find(subCategoriesQuery) 
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .select("-__v")
    .populate("categoryId")
    // .lean();

  const subCategoriesLength = subCategories.length;

  // Fetch books with pagination
  const booksQuery = { ...query, categoryId: categoryId }; // Apply the same query to books
  const books = await productsModel
    .find(booksQuery) // Use the same query for books
    .sort(sort)
    .skip(subCategoriesLength === 0 ? offset : 0)
    .limit(subCategoriesLength === 0 ? limit : 0)
    .select("-__v")
    .populate("authorId");

  if (subCategoriesLength > 0 && (!books || books.length === 0)) {
    return errorResponseHandler("No blog found for this category", httpStatusCode.NO_CONTENT, res);
  }
  if (subCategoriesLength === 0 && books.length === 0) {
    return errorResponseHandler("No sub-categories and book found for this category", httpStatusCode.NO_CONTENT, res);
  }

  const response = subCategoriesLength > 0 ? { subcategory: subCategories, books: [] } : { subcategory: [], books: books };

  let totalDataCount = 0;
  if (subCategoriesLength > 0) {
    totalDataCount = await subCategoriesModel.countDocuments(subCategoriesQuery);
  } else {
    totalDataCount = await productsModel.countDocuments(booksQuery);
  }

  return {
    success: true,
    message: "Sub categories retrieved successfully",
    data: response,
    page,
    limit,
    total: totalDataCount,
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

  const deletedSubCategory = await subCategoriesModel.findByIdAndDelete(id).populate("categoryId");
  if (!deletedSubCategory) return errorResponseHandler("Sub-category not found", httpStatusCode.NOT_FOUND, res);
  if (deletedSubCategory?.image) {
    await deleteFileFromS3(deletedSubCategory?.image);
  }
  return {
    success: true,
    message: "Sub-category deleted successfully",
    data: deletedSubCategory,
  };
};

export const addBookToSubCategoryService = async (payload: any, id: string, res: Response) => {
  try {
    const { booksId } = payload;

    const updatedBooks = await productsModel.updateMany(
      { _id: { $in: booksId } },
      {
        $addToSet: {
          subCategoryId: id,
        },
      }
    );

    if (updatedBooks.modifiedCount === 0) return errorResponseHandler("No books found to update", httpStatusCode.NOT_FOUND, res);

    return {
      success: true,
      message: "Books Added to Sub-Category successfully",
      data: updatedBooks,
    };
  } catch (error) {
    console.error("Error updating books:", error); // Log the error for debugging
    return errorResponseHandler("Failed to update books", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};
