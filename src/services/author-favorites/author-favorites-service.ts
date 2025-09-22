import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { queryBuilder } from "src/utils";
import { authorFavoritesModel } from "src/models/author-favorites/author-favorites-schema";
import mongoose from "mongoose";

export const createAuthorFavoriteService = async (payload: any, user: any, res: Response) => {
	try {
		const newFavorite = new authorFavoritesModel({ ...payload, userId: user.id });
		const savedFavorite = await newFavorite.save();
		return {
			success: true,
			message: "Favorite created successfully",
			data: savedFavorite,
		};
	} catch (error) {
		return errorResponseHandler("Error creating favorite", httpStatusCode.INTERNAL_SERVER_ERROR, res);
	}
};

export const getAuthorFavoriteService = async (id: string, user: any, res: Response) => {
	try {
		const favorite = await authorFavoritesModel.findById(id);

		if (!favorite) return errorResponseHandler("Favorite not found", httpStatusCode.NOT_FOUND, res);
		return {
			success: true,
			message: "Favorite retrieved successfully",
			data: favorite,
		};
	} catch (error) {
		return errorResponseHandler("Error retrieving favorite", httpStatusCode.INTERNAL_SERVER_ERROR, res);
	}
};


export const getAllAuthorFavoritesService = async (payload: any, user: any, res: Response) => {
	const page = parseInt(payload.page as string) || 1;
	const limit = parseInt(payload.limit as string) || 0;
	const skip = (page - 1) * limit;

	// Use queryBuilder to extract sort options
	const { sort } = queryBuilder(payload, ["name"]);

	// Build match filters for nested author fields
	const authorMatch: any = {};
	[ "genres", "country"].forEach((key) => {
		if (payload[key]) {
			authorMatch[key] = {
				$in: Array.isArray(payload[key]) ? payload[key] : [payload[key]],
			};
		}
	});

	// Build aggregation pipeline
	const pipeline: any[] = [
		{
			$match: {
				userId: new mongoose.Types.ObjectId(user.id),
			},
		},
		{
			$lookup: {
				from: "authors", // collection name
				localField: "authorId",
				foreignField: "_id",
				as: "authorId",
			},
		},
		{
			$unwind: "$authorId",
		},
	];

	// Add nested filtering on author fields
	if (Object.keys(authorMatch).length > 0) {
		pipeline.push({
			$match: Object.entries(authorMatch).reduce((acc: any, [key, value]) => {
				acc[`authorId.${key}`] = value;
				return acc;
			}, {}),
		});
	}

	// Total count before pagination
	const totalCountPipeline = [...pipeline, { $count: "total" }];
	const totalResult = await authorFavoritesModel.aggregate(totalCountPipeline);
	const total = totalResult[0]?.total || 0;

	// Sorting (ensure at least one sort key)
	if (sort && Object.keys(sort).length > 0) {
		pipeline.push({ $sort: sort });
	} else {
		pipeline.push({ $sort: { createdAt: -1 } });
	}

	// Pagination
	if (limit > 0) {
		pipeline.push({ $skip: skip }, { $limit: limit });
	}

	// Fetch results
	const results = await authorFavoritesModel.aggregate(pipeline);

	// Transform data to include favorite flag
	const modifiedResults = results.map((item) => ({
		...item,
		productId: {
			...item.authorId,
			favorite: true,
		},
	}));

	// Return response
	if (modifiedResults.length > 0) {
		return {
			page,
			limit,
			success: true,
			message: "Favorites retrieved successfully",
			total,
			data: modifiedResults,
		};
	} else {
		return {
			page,
			limit,
			success: false,
			message: "No favorites found",
			total: 0,
			data: [],
		};
	}
};

// export const getAllAuthorFavoritesService = async (payload: any, user: any, res: Response) => {
//   const page = parseInt(payload.page as string) || 1;
//   const limit = parseInt(payload.limit as string) || 0;
//   const offset = (page - 1) * limit;
//   const { query, sort } = queryBuilder(payload, ["name"]);
// ['type', 'genres', 'country'].forEach((key) => {
//     if (payload[key]) {
//       (query as any)[key === 'type' ? 'profession' : key] = {
//         $in: Array.isArray(payload[key]) ? payload[key] : [payload[key]],
//       };
//     }
//   });
//   (query as any).userId = user.id;
//   console.log('query: ', query);

//   const totalDataCount = Object.keys(query).length < 1 ? await authorFavoritesModel.countDocuments() : await authorFavoritesModel.countDocuments(query);

//   const results = await authorFavoritesModel
//     .find(query)
//     .sort(sort)
//     .skip(offset)
//     .limit(limit)
//     .populate("authorId")
//     .select("-__v")
//     .lean();

//   const modifiedResults = results.map((item) => {
//     if (item.authorId) {
//       return {
//         ...item,
//         productId: {
//           ...item.authorId,
//           favorite: true,
//         },
//       };
//     }
//     return item;
//   });

//   if (modifiedResults.length)
//     return {
//       page,
//       limit,
//       success: true,
//       message: "Favorites retrieved successfully",
//       total: totalDataCount,
//       data: modifiedResults,
//     };
//   else {
//     return {
//       data: [],
//       page,
//       limit,
//       success: false,
//       message: "No favorites found",
//       total: 0,
//     };
//   }
// };

export const updateAuthorFavoriteService = async (user: any, payload: any, res: Response) => {
	const isFavorite = typeof payload.favorite === "string" ? JSON.parse(payload.favorite) : payload.favorite;

	if (isFavorite) {
		const updatedFavorite = await authorFavoritesModel.findOneAndUpdate({ authorId: payload.productId, userId: user.id }, { $set: { authorId: payload.authorId, userId: user.id } }, { new: true, upsert: true });
		return {
			success: true,
			message: "Favorite updated successfully",
			data: updatedFavorite,
		};
	} else {
		const Favorite = await authorFavoritesModel.find({ authorId: payload.authorId, userId: user.id });
		if (!Favorite || Favorite.length === 0) {
			return errorResponseHandler("Favorite not found", httpStatusCode.NOT_FOUND, res);
		}
		const deletedFavorite = await authorFavoritesModel.findOneAndDelete({ authorId: payload.authorId, userId: user.id });

		return {
			success: true,
			message: "Favorite Deleted successfully",
			data: deletedFavorite,
		};
	}
};

export const deleteAuthorFavoriteService = async (user: any, id: string, res: Response) => {
	const deletedFavorite = await authorFavoritesModel.findOneAndDelete({ authorId: id, userId: user.id });
	if (!deletedFavorite) {
		return errorResponseHandler("Favorite not found", httpStatusCode.NOT_FOUND, res);
	}
	return {
		success: true,
		message: "Favorite Deleted successfully",
		data: deletedFavorite ? deletedFavorite : {},
	};
};
