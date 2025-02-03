import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { nestedQueryBuilder, queryBuilder } from "src/utils";
import { bookMastersModel } from "../../models/book-masters/book-masters-schema"; 
import { productsModel } from "../../models/products/products-schema"; // Import productsModel
import { PipelineStage } from "mongoose";


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
      _id: { $nin: bookMasterProductIds },
      type:"course"
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
  const { query, sort } = nestedQueryBuilder(payload, ["name","authorId"]);

  const totalDataCount = Object.keys(query).length < 1 ? await bookMastersModel.countDocuments() : await bookMastersModel.countDocuments(query);
  const results = await bookMastersModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v").populate({
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

// export const getAllBookMastersService = async (payload: any, res: Response) => {
//   const page = parseInt(payload.page as string) || 1;
//   const limit = parseInt(payload.limit as string) || 0;
//   const offset = (page - 1) * limit;
//   const { query, sort } = queryBuilder(payload, ["name", "authorId"]);

//   try {
//     const pipeline: PipelineStage[] = [
//       { $match: query },
//       {
//         $lookup: {
//           from: "products", // The collection name of the products
//           localField: "productsId",
//           foreignField: "_id",
//           as: "products",
//         },
//       },
//       { $unwind: "$products" },
//       {
//         $lookup: {
//           from: "authors", // The collection name of the authors
//           localField: "products.authorId",
//           foreignField: "_id",
//           as: "products.author",
//         },
//       },
//       { $unwind: "$products.author" },
//       {
//         $match: {
//           $or: [
//             { "products.name": { $regex: query, $options: "i" } },
//             { "products.author.name": { $regex: query, $options: "i" } },
//           ],
//         },
//       },
//       {
//         $group: {
//           _id: "$_id",
//           doc: { $first: "$$ROOT" },
//         },
//       },
//       { $replaceRoot: { newRoot: "$doc" } },
//       // { $sort: sort },
//       { $skip: offset },
//       { $limit: limit },
//     ];

//     const totalDataCountPipeline: PipelineStage[] = [
//       { $match: query },
//       {
//         $lookup: {
//           from: "products",
//           localField: "productsId",
//           foreignField: "_id",
//           as: "products",
//         },
//       },
//       { $unwind: "$products" },
//       {
//         $lookup: {
//           from: "authors",
//           localField: "products.authorId",
//           foreignField: "_id",
//           as: "products.author",
//         },
//       },
//       { $unwind: "$products.author" },
//       {
//         $match: {
//           $or: [
//             { "products.name": { $regex: payload.name, $options: "i" } },
//             { "products.author.name": { $regex: payload.authorId, $options: "i" } },
//           ],
//         },
//       },
//       {
//         $group: {
//           _id: null,
//           count: { $sum: 1 },
//         },
//       },
//     ];

//     const [results, totalDataCountResult] = await Promise.all([
//       bookMastersModel.aggregate(pipeline),
//       bookMastersModel.aggregate(totalDataCountPipeline),
//     ]);

//     const totalDataCount = totalDataCountResult.length > 0 ? totalDataCountResult[0].count : 0;

//     if (results.length) {
//       return {
//         page,
//         limit,
//         success: true,
//         total: totalDataCount,
//         data: results,
//       };
//     } else {
//       return {
//         data: [],
//         page,
//         limit,
//         success: false,
//         total: 0,
//       };
//     }
//   } catch (error) {
//     console.error("Error in getAllBookMastersService:", error);
//     return errorResponseHandler("Failed to fetch book masters", httpStatusCode.INTERNAL_SERVER_ERROR, res);
//   }
// };



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
