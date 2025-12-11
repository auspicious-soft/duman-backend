import { httpStatusCode } from "src/lib/constant";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { Response } from "express";
import { getAllBannersService } from "../banners/banners-service";
import { getAllStoriesService } from "../stories/stories-service";
import { getAllCollectionsService, getAllCollectionsWithBooksService } from "../collections/collections-service";
import { getAllBookLivesWithBlogsService } from "../book-lives/book-lives-service";
import { getAllBooksService, getAllProductsForStocksTabService } from "../products/products-service";
import { readProgressModel } from "src/models/user-reads/read-progress-schema";
import { usersModel } from "src/models/user/user-schema";

export const getHomePageService = async (userData: any, payload: any, res: Response) => {
	try {
		const bannersResponse: any = await getAllBannersService(payload, res);
		const storiesResponse: any = await getAllStoriesService(payload, res);
		let readProgress = await readProgressModel
			.find({ userId: userData.id, isCompleted: false, $and: [{ progress: { $lt: 100, $gte: 0 } }, { audiobookProgress: { $lt: 100, $gte: 0 } }] })
			.sort({ updatedAt: -1 })
			.limit(5)
			.populate({
				path: "bookId",
				select: "_id name type image format ",
				populate: [{ path: "authorId", select: "name" }],
			})
			.select("-certificate -createdAt -readSections -updatedAt -__v");
		readProgress = readProgress.map((item: any) => {
			const highestProgress = Math.max(item.progress || 0, item.audiobookProgress || 0);
			return {
				...item.toObject(),
				progress: highestProgress, // overwrite progress
			};
		});
		const banners = bannersResponse?.data?.length ? bannersResponse.data : [];
		const stories = storiesResponse?.data?.length ? storiesResponse.data : [];
		const userdetails = await usersModel.findById(userData.id).select("schoolVoucher firstName fullName email");
		const userSchoolVoucher = userdetails?.schoolVoucher?.voucherId ? true : false;

		if (!banners.length && !stories.length && !readProgress.length) {
			return {
				success: false,
				message: "No content available for home page",
				data: {
					banners: [],
					stories: [],
					readProgress: [],
					userSchoolVoucher,
				},
			};
		}

		return {
			success: true,
			message: "Home page data retrieved successfully",
			data: {
				banners,
				stories,
				readProgress,
				userSchoolVoucher,
				userdetails,
			},
		};
	} catch (error: any) {
		return errorResponseHandler(error.message || "An error occurred while retrieving home page data", httpStatusCode.INTERNAL_SERVER_ERROR, res);
	}
};

export const getproductsTabService = async (payload: any, res: Response) => {
	try {
		switch (payload.type) {
			case "stock":
				const stocks = await getAllProductsForStocksTabService(payload, res);
				return {
					success: true,
					message: "Stocks retrieved successfully",
					data: stocks.success ? stocks : [],
				};
			case "collections":
				const collections = await getAllCollectionsWithBooksService(payload, res);
				return {
					success: true,
					message: "Collections retrieved successfully",
					data: collections.success ? collections : [],
				};
			case "blog":
				const blogs = await getAllBookLivesWithBlogsService(payload, res);
				return {
					success: true,
					message: "Blogs retrieved successfully",
					data: blogs.success ? blogs : [],
				};
			default: {
				const stocks = await getAllProductsForStocksTabService(payload, res);
				return {
					success: true,
					message: "Stocks retrieved successfully",
					data: stocks.success ? stocks : [],
				};
			}
		}
	} catch (error: any) {
		return errorResponseHandler(error.message, httpStatusCode.INTERNAL_SERVER_ERROR, res);
	}
};
