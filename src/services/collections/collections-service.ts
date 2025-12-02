import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { filterBooksByLanguage, nestedQueryBuilder, queryBuilder, sortBooks, sortByLanguagePriority, toArray } from "src/utils";
import { deleteFileFromS3 } from "src/config/s3";
import { collectionsModel } from "../../models/collections/collections-schema";
import { favoritesModel } from "src/models/product-favorites/product-favorites-schema";
import { productsModel } from "src/models/products/products-schema";
import { usersModel } from "src/models/user/user-schema";


export const createCollectionService = async (payload: any, res: Response) => {
  const newCollection = new collectionsModel(payload);
  const savedCollection = await newCollection.save();
  return {
    success: true,
    message: "Collection created successfully",
    data: savedCollection,
  };
};


export const getCollectionService = async (id: string, payload: any, res: Response) => {
  const { query, sort } = nestedQueryBuilder(payload, ["name"]);

  // First, get the collection with all its books
  const collection = await collectionsModel.findById(id).populate({
    path: "booksId",
    populate: [
      { path: "authorId" },
      { path: "categoryId" },
      { path: "subCategoryId" },
      { path: "publisherId" },
    ],
  });

  if (!collection) return errorResponseHandler("Collection not found", httpStatusCode.NOT_FOUND, res);

  // If there's a search query and the collection has books
  if (Object.keys(query).length > 0 && collection.booksId && Array.isArray(collection.booksId)) {
    // Filter the books based on the search query
    const filteredBooks = collection.booksId.filter((book: any) => {
      // Check if book name matches the query in any language
      if (book.name) {
        // Check direct name match
        if (typeof book.name === 'string' && book.name.match(new RegExp(payload.description, 'i'))) {
          return true;
        }

        // Check multilingual name object
        if (typeof book.name === 'object') {
          for (const lang of ['eng', 'kaz', 'rus']) {
            if (book.name[lang] && book.name[lang].match(new RegExp(payload.description, 'i'))) {
              return true;
            }
          }
        }
      }

      // Check if any author name matches the query
      if (book.authorId && Array.isArray(book.authorId)) {
        for (const author of book.authorId) {
          if (author.name) {
            // Check direct author name match
            if (typeof author.name === 'string' && author.name.match(new RegExp(payload.description, 'i'))) {
              return true;
            }

            // Check multilingual author name object
            if (typeof author.name === 'object') {
              for (const lang of ['eng', 'kaz', 'rus']) {
                if (author.name[lang] && author.name[lang].match(new RegExp(payload.description, 'i'))) {
                  return true;
                }
              }
            }
          }
        }
      }

      return false;
    });

    // Create a new collection object with filtered books
    const collectionWithFilteredBooks = {
      ...collection.toObject(),
      booksId: filteredBooks
    };

    return {
      success: true,
      message: "Collection retrieved successfully",
      data: collectionWithFilteredBooks,
    };
  }

  // If no search query or no books to filter, return the original collection
  return {
    success: true,
    message: "Collection retrieved successfully",
    data: collection,
  };
};

export const getCollectionForUserService = async (payload:any, user: any, id: string, res: Response) => {
  const userData = await usersModel.findById(user.id);
  const collection = await collectionsModel.findById(id).populate({
    path: "booksId",
    populate: [
      { path: "authorId" },
      { path: "categoryId" },
      { path: "subCategoryId" },
      { path: "publisherId" },
    ],
  });

  // If collection is not found, return an error response
  if (!collection) return errorResponseHandler("Collection not found", httpStatusCode.NOT_FOUND, res);

  // Find the user's favorite books
  const favoriteBooks = await favoritesModel.find({ userId: user.id }).populate("productId");

  // Safe check to ensure each favorite book has a valid productId and productId._id
  const favoriteIds = favoriteBooks
    .filter((book) => book.productId && book.productId._id)  // Ensure valid productId and _id
    .map((book) => book.productId._id.toString());

  // Check if booksId exists and is an array, then map through it
  if (!collection.booksId || !Array.isArray(collection.booksId)) {
    return errorResponseHandler("Invalid books data in the collection", httpStatusCode.BAD_REQUEST, res);
  }

  // Map through the books in the collection and add the isFavorite field
  let updatedBooks = collection.booksId.map((book: any) => {
    if (!book || !book._id) {
      return null; // Skip invalid or incomplete book objects
    }

    return {
      ...book.toObject(),  // Convert mongoose object to plain JS object
      isFavorite: favoriteIds.includes(book._id.toString()),  // Check if the book is in the user's favorites
    };
  }).filter((book) => book !== null); // Remove any null values from the mapped array
    const languages = toArray(payload.language);
    updatedBooks = filterBooksByLanguage(updatedBooks, languages);
    updatedBooks = sortBooks(updatedBooks, payload.sorting, userData?.productsLanguage, userData?.language);

    // const audiobooksWithFavoriteStatus = updatedBooks.map((book) => ({
    //   ...book.toObject(),
    //   isFavorite: favoriteIds.includes(book._id.toString()),
    // }));
  // sortByLanguagePriority(updatedBooks, "file", userData?.productsLanguage || []);

  // Return the updated collection data with the favorite status added to each book
  return {
    success: true,
    message: "Collection retrieved successfully",
    data: {
      // ...collection.toObject(),
      books: updatedBooks,  // Replace the booksId with the updated books
    },
  };
};



export const getAllCollectionsService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 100;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys({...query}).length < 1 ? await collectionsModel.countDocuments() : await collectionsModel.countDocuments(query);
  const results = await collectionsModel.find({...query}).sort({
    createdAt: -1,
    ...sort,
  }).skip(offset).limit(limit).select("-__v").populate({
    path: "booksId",
    populate: [
      { path: "authorId",select: "name" },
      { path: "categoryId",select: "name" },
      { path: "subCategoryId",select: "name" },
      { path: "publisherId",select: "name" },
    ],
  });
  if (results.length)
    return {
      page,
      limit,
      success: true,
      message: "Collections retrieved successfully",
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
export const getAllCollectionsUserService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 100;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]);

  const totalDataCount = Object.keys({...query}).length < 1 ? await collectionsModel.countDocuments({...query,displayOnMobile: true}) : await collectionsModel.countDocuments(query);
  const results = await collectionsModel.find({...query,displayOnMobile: true}).sort({
    createdAt: -1,
    ...sort,
  }).skip(offset).limit(limit).select("-__v").populate({
    path: "booksId",
    populate: [
      { path: "authorId",select: "name" },
      { path: "categoryId",select: "name" },
      { path: "subCategoryId",select: "name" },
      { path: "publisherId",select: "name" },
    ],
  });
  if (results.length)
    return {
      page,
      limit,
      success: true,
      message: "Collections retrieved successfully",
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
export const getAllCollectionsWithBooksService = async (payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 100;
  const offset = (page - 1) * limit;
  const { query, sort } = nestedQueryBuilder(payload, ["name"]);

 
  const nonEmptyBooksQuery = {
    ...query,
    displayOnMobile: true,
    booksId: { $exists: true, $ne: [] }
  };

  const totalDataCount = await collectionsModel.countDocuments(nonEmptyBooksQuery);

  // Get collections with books and limit categories to 3
  const results = await collectionsModel.find(nonEmptyBooksQuery).sort({
    createdAt: -1,
    ...sort,
  }).skip(offset).limit(limit).select("-__v").populate({
    path: "booksId",
    populate: [
      { path: "authorId", select: "name image" },
      {
        path: "categoryId",
        select: "name image",
        options: { limit: 3 } // Limit categories to 3
      },
      { path: "subCategoryId", select: "name image" },
      { path: "publisherId", select: "name image" },
    ],
  });
  
  console.log('results: ', results);
  if (results.length) {
    // Transform the results into the desired format with exactly 3 static keys
    const transformedData: Record<string, any[]> = {
      "mind-blowing": [],
      "popular_collections": [],
      "new_collections": []
    };

    // Limit to 5 entries
    const limitedResults = results.slice(0, 5);

    // Ensure a more balanced distribution regardless of collection count
    const keys = ["mind-blowing", "popular_collections", "new_collections"];

    // If we have fewer collections than keys, distribute them evenly
    if (limitedResults.length < keys.length) {
      // Calculate how many collections each key should get (at least 0)
      const collectionsPerKey = Math.floor(limitedResults.length / keys.length) || 0;
      // Calculate how many keys get an extra collection
      const extraCollections = limitedResults.length % keys.length;

      let collectionIndex = 0;

      // Distribute collections evenly among all keys
      keys.forEach((key, keyIndex) => {
        // Each key gets the base number of collections
        let collectionsForThisKey = collectionsPerKey;

        // Some keys get an extra collection if there are remainders
        if (keyIndex < extraCollections) {
          collectionsForThisKey += 1;
        }

        // Add the calculated number of collections to this key
        for (let i = 0; i < collectionsForThisKey && collectionIndex < limitedResults.length; i++) {
          transformedData[key].push(limitedResults[collectionIndex]);
          collectionIndex++;
        }
      });
    } else {
      // If we have enough collections, distribute them evenly
      limitedResults.forEach((collection, index) => {
        transformedData[keys[index % keys.length]].push(collection);
      });
    }
    
    console.log('transformedData: ', transformedData);
       return {
      page,
      limit,
      success: true,
      message: "Collections with books retrieved successfully",
      total: totalDataCount,
      data: transformedData,
    };
  } else {
    return {
      data: {},
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
    message: "Collection Deleted successfully",
    data: deletedCollection,
  };
};

