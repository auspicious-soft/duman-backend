import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { categoriesModel } from "../../models/categories/categroies-schema";
import { subCategoriesModel } from "src/models/sub-categories/sub-categories-schema";
import { productsModel } from "src/models/products/products-schema";
import { applyFilters, filterBooksByLanguage, nestedQueryBuilder, queryBuilder, sortBooks, sortByLanguagePriority, toArray } from "src/utils";
import { deleteFileFromS3 } from "src/config/s3";
import { favoritesModel } from "src/models/product-favorites/product-favorites-schema";
import { usersModel } from "src/models/user/user-schema";

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
  if (!category) return errorResponseHandler("Category not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Category retrieved successfully",
    data: category,
  };
};

// export const getBooksByCategoryIdService = async (id: string, user: any, payload: any, res: Response) => {
//   const userData = await usersModel.findById(user.id);
//   const category = await categoriesModel.findById(id);
//   if (!category) return errorResponseHandler("Category not found", httpStatusCode.NOT_FOUND, res);

//   const favoriteBooks = await favoritesModel.find({ userId: user.id }).populate("productId");
//   const favoriteIds = favoriteBooks.map((book) => book.productId?._id.toString());

//   const categoryBooks = await productsModel.find({ categoryId: id }).populate([
//     { path: "authorId", select: "name" },
//     { path: "categoryId", select: "name" },
//     { path: "publisherId", select: "name" },
//   ]);

//   let categoryBooksWithFavoriteStatus = categoryBooks.map((book) => ({
//     ...book.toObject(),
//     isFavorite: favoriteIds.includes(book._id.toString()), // Check if the book is in the user's favorites
//   }));
//   const languages = toArray(payload.language);
//   categoryBooksWithFavoriteStatus = filterBooksByLanguage(categoryBooksWithFavoriteStatus, languages);

//   if (!categoryBooksWithFavoriteStatus.length) {
//     return errorResponseHandler("No books found for the selected languages", httpStatusCode.NO_CONTENT, res);
//   }

//   // ✅ Apply Sorting Based on Payload.sorting
//   categoryBooksWithFavoriteStatus = sortBooks(categoryBooksWithFavoriteStatus, payload.sorting, userData?.productsLanguage, userData?.language);
//   // sortByLanguagePriority(categoryBooksWithFavoriteStatus, "file", userData?.productsLanguage || []);


//   return {
//     success: true,
//     message: "Category retrieved successfully",
//     data: { category, books: categoryBooksWithFavoriteStatus },
//   };
// };


export const getBooksByCategoryIdService = async (
  id: string,
  user: any,
  payload: any,
  res: Response
) => {
  const userData = await usersModel.findById(user.id);
  const category = await categoriesModel.findById(id);
  if (!category) return errorResponseHandler("Category not found", httpStatusCode.NOT_FOUND, res);

  const favoriteBooks = await favoritesModel.find({ userId: user.id }).populate("productId");
  const favoriteIds = favoriteBooks.map((book) => book.productId?._id.toString());

  const categoryBooks = await productsModel.find({ categoryId: id }).populate([
    { path: "authorId", select: "name" },
    { path: "categoryId", select: "name" },
    { path: "publisherId", select: "name" },
  ]);

  let categoryBooksWithFavoriteStatus = categoryBooks.map((book) => ({
    ...book.toObject(),
    isFavorite: favoriteIds.includes(book._id.toString()),
  }));

  const languages = toArray(payload.language);
  categoryBooksWithFavoriteStatus = filterBooksByLanguage(categoryBooksWithFavoriteStatus, languages);

  if (!categoryBooksWithFavoriteStatus.length) return errorResponseHandler("No books found", httpStatusCode.NOT_FOUND, res);

  // ✅ Apply Sorting
  categoryBooksWithFavoriteStatus = sortBooks(
    categoryBooksWithFavoriteStatus,
    payload.sorting,
    userData?.productsLanguage,
    userData?.language
  );

  // ✅ Pagination Logic
  const page = parseInt(payload.page) || 1;
  const limit = parseInt(payload.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedBooks = categoryBooksWithFavoriteStatus.slice(startIndex, endIndex);
 //TODO:ADDED PAGINATION
  return {
    success: true,
    message: "Category retrieved successfully",
    total: categoryBooksWithFavoriteStatus.length,
    page,
    limit,
    // totalPages: Math.ceil(categoryBooksWithFavoriteStatus.length / limit),
    // hasNextPage: endIndex < categoryBooksWithFavoriteStatus.length,
    // hasPrevPage: startIndex > 0,
    data: {
      category,
      books: paginatedBooks,
    },
  };
};


export const getAllCategoriesService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys(query).length < 1 ? await categoriesModel.countDocuments() : await categoriesModel.countDocuments(query);
  const results = await categoriesModel.find(query).sort({
    createdAt: -1,  
  }).skip(offset).limit(limit).select("-__v");
  if (results.length)
    return {
      page,
      limit,
      success: true,
      message: "Categories retrieved successfully",
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      limit,
      message: "No categories found",
      success: false,
      total: 0,
    };
  }
};

export const updateCategoryService = async (id: string, payload: any, res: Response) => {
  const updatedCategory = await categoriesModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedCategory) return errorResponseHandler("Category not found", httpStatusCode.NOT_FOUND, res);
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
    // return errorResponseHandler("Cannot delete category with existing sub-categories", httpStatusCode.BAD_REQUEST, res);
    return{
      success:false,
      message: "Cannot delete category with existing sub-categories",
    }
  }
  if (books.length > 0) {
    // return errorResponseHandler("Cannot delete category with existing books", httpStatusCode.BAD_REQUEST, res);
    return{
      success:false,
      message: "Cannot delete category with existing books",
    }
  }
  const deletedCategory = await categoriesModel.findByIdAndDelete(id);
  if (!deletedCategory) return errorResponseHandler("Category not found", httpStatusCode.NOT_FOUND, res);
  if (deletedCategory?.image) {
    await deleteFileFromS3(deletedCategory?.image);
  }
  return {
    success: true,
    message: "Category Deleted successfully",
    data: deletedCategory,
  };
};

export const addBookToCategoryService = async (payload: any, id: string, res: Response) => {
  try {
    const { booksId } = payload;

    const updatedBooks = await productsModel.updateMany(
      { _id: { $in: booksId } },
      {
        $addToSet: {
          categoryId: id,
        },
      }
    );

    if (updatedBooks.modifiedCount === 0) return errorResponseHandler("No books found to update", httpStatusCode.NOT_FOUND, res);

    return {
      success: true,
      message: "Books Added to Category successfully",
      data: updatedBooks,
    };
  } catch (error) {
    console.error("Error updating books:", error); // Log the error for debugging
    return errorResponseHandler("Failed to update books", httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};
