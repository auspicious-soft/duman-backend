import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { filterBooksByLanguage, nestedQueryBuilder, queryBuilder, sortBooks, toArray } from "src/utils";
import { productsModel } from "src/models/products/products-schema";
import { usersModel } from "src/models/user/user-schema";
import { bookSchoolsModel } from "./../../models/book-schools/book-schools-schema";
import mongoose from "mongoose";
import { favoritesModel } from "src/models/product-favorites/product-favorites-schema";

export const createBookSchoolService = async (payload: any, res: Response) => {
  const newBookSchool = new bookSchoolsModel(payload);
  const savedBookSchool = await newBookSchool.save();
  return {
    success: true,
    message: "Book school created successfully",
    data: savedBookSchool,
  };
};

export const getBookSchoolService = async (payload: any, id: string, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]);

  const bookSchool = await bookSchoolsModel.findById(id).populate("publisherId");
  if (!bookSchool) return errorResponseHandler("Book school not found", httpStatusCode.NOT_FOUND, res);
  // const totalDataCount =
  //   Object.keys(query).length < 1
  //     ? await productsModel.countDocuments({
  //         publisherId: { $in: bookSchool?.publisherId },
  //         type: "e-book",
  //         ...query,
  //       })
  //     : await productsModel.countDocuments(query);

  //TODO--CHANGED
  const totalDataCount =
    Object.keys(query).length < 1
      ? await productsModel.countDocuments({
          publisherId: { $in: bookSchool?.publisherId },
          // type: "e-book", //TODO--CHANGED
          type:"audio&ebook",
          format: { $nin: ["audiobook", null] },
          ...query,
        })
      : await productsModel.countDocuments(query);
  const books = await productsModel
    .find({
      publisherId: { $in: bookSchool?.publisherId },
      // type: "e-book", //TODO--CHANGED
      type:"audio&ebook",
      format: { $nin: ["audiobook", null] },
      ...query,
    })
    .sort(sort)
    .skip(offset)
    .limit(limit)
    .select("-__v")
    .populate([{ path: "publisherId" }, { path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }]);

  return {
    success: true,
    data: { bookSchool, books },
    message: "Book school retrieved successfully",
    page,
    limit,
    total: totalDataCount,
  };
};

export const getAllBookSchoolsService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys(query).length < 1 ? await bookSchoolsModel.countDocuments() : await bookSchoolsModel.countDocuments(query);
  const results = await bookSchoolsModel
    .find(query)
    .sort({
      createdAt: -1,  
    })
    .skip(offset)
    .limit(limit)
    .select("-__v")
    .populate([{ path: "publisherId" }]);

  if (results.length)
    return {
      page,
      message: "Book schools retrieved successfully",
      limit,
      success: true,
      total: totalDataCount,
      data: results,
    };
  else {
    return {
      data: [],
      page,
      message: "No book schools found",
      limit,
      success: false,
      total: 0,
    };
  }
};
export const getBookSchoolsByCodeService = async (payload: any, user: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const userId = user.id;
  const schoolVoucher = (await usersModel.findById(userId))?.schoolVoucher;

  let results: any[] = [];
  if (schoolVoucher) {
    const modifiedQuery = {  _id: schoolVoucher.voucherId };
    results = await bookSchoolsModel.find(modifiedQuery).select("-__v");
  }
  const publisherId = results.map((school) => school.publisherId).flat(); // Flatten the array if needed

  const publisherObjectIds = publisherId.map((id: any) => id);

//TODO--CHANGED
  // const bookSchoolData = await productsModel
  //   .find({ publisherId: { $in: publisherObjectIds }, type: "e-book" })
  //   .skip(offset)
  //   .limit(limit)
  //   .populate([
  //     { path: "publisherId", select: "name" },
  //     { path: "authorId", select: "name" },
  //     { path: "categoryId", select: "name" },
  //     { path: "subCategoryId", select: "name" },
  //   ]);
  const bookSchoolData = await productsModel
  // .find({publisherId: { $in: publisherObjectIds }})
  .find({ publisherId: { $in: publisherObjectIds }, type: "audio&ebook", format: { $nin: ["audiobook", null] } })
  .skip(offset)
  .limit(limit)
  .populate([
    { path: "publisherId", select: "name" },
    { path: "authorId", select: "name" },
    { path: "categoryId", select: "name" },
    { path: "subCategoryId", select: "name" },
  ]);
  
  console.log('bookSchoolData: ', bookSchoolData);
  // const total = bookSchoolData.length;
    const favoriteBooks = await favoritesModel.find({ userId: user.id }).populate("productId");
  const favoriteIds = favoriteBooks
    .filter((book) => book.productId && book.productId._id)
    .map((book) => book.productId._id.toString());

  let newBooksWithFavoriteStatus = bookSchoolData.map((book) => ({
    ...book.toObject(),
    isFavorite: favoriteIds.includes(book._id.toString()),
    isPurchased: true,
  }));
  const languages = toArray(payload.language);
  const filteredResult = filterBooksByLanguage(newBooksWithFavoriteStatus, languages);
  const sortedResult = sortBooks(filteredResult, payload.sorting, user?.productsLanguage, user?.language);
  const total = sortedResult.length;
  const paginatedResults = sortedResult.slice(offset, offset + limit);

  if (results.length)
    return {
      page,
      limit,
      message: "Book schools retrieved successfully",
      success: true,
      total: total,
      // data: newBooksWithFavoriteStatus,
      data: paginatedResults,
    };
    
  else {
    return {
      data: [],
      message: "No book schools found",
      page,
      limit,
      success: false,
      total: 0,
    };
  }
};
export const verifyBookSchoolsByCodeService = async (payload: any, userData: any, res: Response) => {
  const { query } = queryBuilder(payload, ["couponCode"]);
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const totalDataCount = Object.keys(query).length < 1 ? await bookSchoolsModel.countDocuments() : await bookSchoolsModel.countDocuments(query);
  const bookSchool = await bookSchoolsModel.find({ couponCode: payload.couponCode }).populate([{ path: "publisherId" }]);
  const bookSchoolId = bookSchool.map((school) => school._id);
  let userQuery;
  if (userData.email) {
    userQuery = { email: userData.email };
  } else {
    userQuery = { phoneNumber: userData.phoneNumber };
  }

  const user = await usersModel.findOne(userQuery).populate([{ path: "schoolVoucher.voucherId" }]);

  if (user && user.schoolVoucher) {
    user.schoolVoucher.voucherId = bookSchoolId[0];
    user.schoolVoucher.createdAt = new Date();
    user.schoolVoucher.expiredAt = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    await user.save();
    if (bookSchool.length > 0 && bookSchool[0].allowedActivation > bookSchool[0].codeActivated) {
      for (const school of bookSchool) {
        school.codeActivated += 1;
        await school.save();
      }
    } else {
      return errorResponseHandler("Book school coupon limit exceeded", httpStatusCode.BAD_REQUEST, res);
    }
  }

  return {
    success: true,
    message: "Book school verified successfully",
    total: totalDataCount,
    data: user,
  };
};

export const updateBookSchoolService = async (id: string, payload: any, res: Response) => {
  const updatedBookSchool = await bookSchoolsModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedBookSchool) return errorResponseHandler("Book school not found", httpStatusCode.NOT_FOUND, res);

  return {
    success: true,
    message: "Book school updated successfully",
    data: updatedBookSchool,
  };
};

export const deleteBookSchoolService = async (id: string, res: Response) => {
  const deletedBookSchool = await bookSchoolsModel.findByIdAndDelete(id);
  if (!deletedBookSchool) return errorResponseHandler("Book school not found", httpStatusCode.NOT_FOUND, res);

  return {
    success: true,
    message: "Book school Deleted successfully",
    data: deletedBookSchool,
  };
};
