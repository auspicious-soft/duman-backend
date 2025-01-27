import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { bookStudiesModel } from "../../models/book-studies/book-studies-schema"; // Import bookStudiesModel
import { productsModel } from "src/models/products/products-schema";


export const addBooksToBookStudy = async (payload: any, res: Response) => {
  try {
    const createdDocuments = [];

    // Iterate over each productId and create a new document
    for (const productId of payload?.productsId) {
      const newDocument = await bookStudiesModel.create({
        productsId: [productId], // Create a new document for each productId
      });
      createdDocuments.push(newDocument); // Store the created document
    }

    return createdDocuments; // Return an array of created documents
  } catch (error) {
    console.error("Error adding books to bookMaster:", error);
    throw new Error("Failed to add books to bookMaster");
  }
};

export const getAvailableProductsService = async (res: Response) => {
  try {
    const bookMasters = await bookStudiesModel.find().select("productsId");
    const bookMasterProductIds = bookMasters.flatMap(bookMaster => bookMaster.productsId);

    const availableProducts = await productsModel.find({
      _id: { $nin: bookMasterProductIds }
    });

    return {
      success: true,
      message: "Available products retrieved successfully",
      data: availableProducts,
    };
  } catch (error) {
    console.error("Error fetching available products:", error);
    throw new Error("Failed to fetch available products");
  }
};
export const getBookStudyService = async (id: string, res: Response) => {
  const bookStudy = await bookStudiesModel.findById(id).populate({
    path: "productsId",
    populate: [
      { path: "authorId" }, 
      { path: "categoryId" }, 
      { path: "subCategoryId" }, 
      { path: "publisherId" }, 
    ],
  });
  
  if (!bookStudy) return errorResponseHandler("Book study not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Book study retrieved successfully",
    data: bookStudy,
  };
};

export const getAllBookStudiesService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["title"]);

  const totalDataCount = Object.keys(query).length < 1 ? await bookStudiesModel.countDocuments() : await bookStudiesModel.countDocuments(query);
  const results = await bookStudiesModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v").populate({
    path: "productsId",
    populate: [
      { path: "authorId" }, 
      { path: "categoryId" }, 
      { path: "subCategoryId" }, 
      { path: "publisherId" }, 
    ],
  });
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

export const updateBookStudyService = async (id: string, payload: any, res: Response) => {
  const updatedBookStudy = await bookStudiesModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedBookStudy) return errorResponseHandler("Book study not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Book study updated successfully",
    data: updatedBookStudy,
  };
};

export const deleteBookStudyService = async (id: string, res: Response) => {
  const deletedBookStudy = await bookStudiesModel.findByIdAndDelete(id);
  if (!deletedBookStudy) return errorResponseHandler("Book study not found", httpStatusCode.NOT_FOUND, res);
  
  return {
    success: true,
    message: "Book study deleted successfully",
    data: deletedBookStudy,
  };
};
