import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { bookMastersModel } from "../../models/book-masters/book-masters-schema"; 
import { productsModel } from "../../models/products/products-schema"; // Import productsModel

// export const createBookMasterService = async (payload: any, res: Response) => {
//   const newBookMaster = new bookMastersModel(payload);
//   const savedBookMaster = await newBookMaster.save();
//   return {
//     success: true,
//     message: "Book master created successfully",
//     data: savedBookMaster,
//   };
// };
// Function to add multiple products to a bookMaster
export const addBooksToBookMaster = async (payload: any, res: Response) => {
  try {
    const createdDocuments = [];

    // Iterate over each productId and create a new document
    for (const productId of payload?.productsId) {
      const newDocument = await bookMastersModel.create({
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
    const bookMasters = await bookMastersModel.find().select("productsId");
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

export const getBookMasterService = async (id: string, res: Response) => {
  const bookMaster = await bookMastersModel.findById(id).populate({
    path: "productsId",
    populate: [
      { path: "authorId" }, 
      { path: "categoryId" }, 
      { path: "subCategoryId" }, 
      { path: "publisherId" }, 
    ],
  });
  if (!bookMaster) return errorResponseHandler("Book master not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Book master retrieved successfully",
    data: bookMaster,
  };
};

export const getAllBookMastersService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys(query).length < 1 ? await bookMastersModel.countDocuments() : await bookMastersModel.countDocuments(query);
  const results = await bookMastersModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
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

export const updateBookMasterService = async (id: string, payload: any, res: Response) => {
  const updatedBookMaster = await bookMastersModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedBookMaster) return errorResponseHandler("Book master not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Book master updated successfully",
    data: updatedBookMaster,
  };
};

export const deleteBookMasterService = async (id: string, res: Response) => {
  const deletedBookMaster = await bookMastersModel.findByIdAndDelete(id);
  if (!deletedBookMaster) return errorResponseHandler("Book master not found", httpStatusCode.NOT_FOUND, res);
  
  return {
    success: true,
    message: "Book master deleted successfully",
    data: deletedBookMaster,
  };
};
