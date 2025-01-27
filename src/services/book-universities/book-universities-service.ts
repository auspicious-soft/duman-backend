import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { bookUniversitiesModel } from "../../models/book-universities/book-universities-schema";
import { productsModel } from "src/models/products/products-schema";



export const addBooksToBookUniversity = async (payload: any, res: Response) => {
  try {
    const createdDocuments = [];

    // Iterate over each productId and create a new document
    for (const productId of payload?.productsId) {
      const newDocument = await bookUniversitiesModel.create({
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
    const bookMasters = await bookUniversitiesModel.find().select("productsId");
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
export const getBookUniversityService = async (id: string, res: Response) => {
  const bookUniversity = await bookUniversitiesModel.findById(id).populate({
    path: "productsId",
    populate: [
      { path: "authorId" }, 
      { path: "categoryId" }, 
      { path: "subCategoryId" }, 
      { path: "publisherId" }, 
    ],
  });
  if (!bookUniversity) return errorResponseHandler("Book university not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Book university retrieved successfully",
    data: bookUniversity,
  };
};

export const getAllBookUniversitiesService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys(query).length < 1 ? await bookUniversitiesModel.countDocuments() : await bookUniversitiesModel.countDocuments(query);
  const results = await bookUniversitiesModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v").populate({
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

export const updateBookUniversityService = async (id: string, payload: any, res: Response) => {
  const updatedBookUniversity = await bookUniversitiesModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedBookUniversity) return errorResponseHandler("Book university not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Book university updated successfully",
    data: updatedBookUniversity,
  };
};

export const deleteBookUniversityService = async (id: string, res: Response) => {
  const deletedBookUniversity = await bookUniversitiesModel.findByIdAndDelete(id);
  if (!deletedBookUniversity) return errorResponseHandler("Book university not found", httpStatusCode.NOT_FOUND, res);
  
  return {
    success: true,
    message: "Book university deleted successfully",
    data: deletedBookUniversity,
  };
};
