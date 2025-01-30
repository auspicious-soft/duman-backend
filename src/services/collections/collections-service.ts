import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { deleteFileFromS3 } from "src/config/s3";
import { collectionsModel } from "../../models/collections/collections-schema";
import { addBooksToCollection } from 'src/controllers/collections/collections-controller';


export const createCollectionService = async (payload: any, res: Response) => {
  const newCollection = new collectionsModel(payload);
  const savedCollection = await newCollection.save();
  return {
    success: true,
    message: "Collection created successfully",
    data: savedCollection,
  };
};


export const getCollectionService = async (id: string, res: Response) => {
  const collection = await collectionsModel.findById(id).populate('booksId');
  if (!collection) return errorResponseHandler("Collection not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Collection retrieved successfully",
    data: collection,
  };
};

export const getAllCollectionsService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;
  const { query, sort } = queryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys(query).length < 1 ? await collectionsModel.countDocuments() : await collectionsModel.countDocuments(query);
  const results = await collectionsModel.find(query).sort(sort).skip(offset).limit(limit).select("-__v");
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

export const updateCollectionService = async (id: string, payload: any, res: Response) => {
  const updatedCollection = await collectionsModel.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!updatedCollection) return errorResponseHandler("Collection not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Collection updated successfully",
    data: updatedCollection,
  };
};
export const addBooksToCollectionService = async (id: string, payload: any, res: Response) => {
  const updatedCollection = await collectionsModel.findByIdAndUpdate(
    id,
    { $addToSet: { booksId: { $each: payload.booksId } } },
    { new: true }
  );
  if (!updatedCollection) return errorResponseHandler("Collection not found", httpStatusCode.NOT_FOUND, res);
  
  return {    
    success: true,
    message: "Collection updated successfully",
    data: updatedCollection,
  };
};

export const deleteCollectionService = async (id: string, res: Response) => {
  const deletedCollection = await collectionsModel.findByIdAndDelete(id);
  if (!deletedCollection) return errorResponseHandler("Collection not found", httpStatusCode.NOT_FOUND, res);
  if (deletedCollection?.image) {
      await deleteFileFromS3(deletedCollection.image);
  }
  return {
    success: true,
    message: "Collection deleted successfully",
    data: deletedCollection,
  };
};
