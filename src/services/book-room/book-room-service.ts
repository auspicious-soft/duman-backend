import { readProgressModel } from "src/models/user-reads/read-progress-schema";
import { favoritesModel } from "src/models/product-favorites/product-favorites-schema";
import { query } from "express";
import { filterBooksByLanguage, sortBooks, toArray } from "src/utils";
import { usersModel } from "src/models/user/user-schema";

export const getAllReadingBooksService = async (user: any, payload: any) => {
	const page = parseInt(payload.page as string) || 1;
	const limit = parseInt(payload.limit as string) || 100;
	const offset = (page - 1) * limit;
	const userData = await usersModel.findById(user.id);
	const readingBooks = await readProgressModel
		.find({
			userId: user.id,
			$and: [{ progress: { $lt: 100} }, { audiobookProgress: { $lt: 100 } }],
		})
		.populate({
			path: "bookId",
			populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
		});
	//TODO--CHANGED
	//TODO--need to be tested
	// const modifiedResults = readingBooks.filter((item: any) => item.bookId.type === "e-book");
	const modifiedResults = readingBooks.filter((item: any) => item?.bookId?.type === "audio&ebook");
	const languages = toArray(payload.language);
	const filteredResult = filterBooksByLanguage(modifiedResults, languages);
	const sortedResult = sortBooks(filteredResult, payload.sorting, userData?.productsLanguage, userData?.language);
	const total = sortedResult.length;
	const finialData = sortedResult.map((item) => ({
		...item,
		progress: item.progress >item.audiobookProgress ? item.progress : item.audiobookProgress,
	}));
	const paginatedResults = finialData.slice(offset, offset + limit);

	if (paginatedResults.length > 0) {
		return {
			page,
			limit,
			success: true,
			message: "Books retrieved successfully",
			total: total,
			data: paginatedResults,
		};
	} else {
		return {
			data: [],
			page,
			limit,
			success: false,
			message: "No books found",
			total: 0,
		};
	}
};
export const getAllFinishedBooksService = async (user: any, payload: any) => {
	const page = parseInt(payload.page as string) || 1;
	const limit = parseInt(payload.limit as string) || 100;
	const offset = (page - 1) * limit;
	const userData = await usersModel.findById(user.id);
	const finishedBooks = await readProgressModel
		.find({
			userId: user.id,
			$or: [{ progress: { $eq: 100 } }, { audiobookProgress: { $eq: 100 } }],
		})
		.populate({
			path: "bookId",
			populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
		});
	//TODO--CHANGED
	// const modifiedResults = finishedBooks.filter((item: any) => item.bookId.type === "e-books");
	const modifiedResults = finishedBooks?.filter((item: any) => item?.bookId?.type === "audio&ebook");
	const languages = toArray(payload.language);
	const filteredResult = filterBooksByLanguage(modifiedResults, languages);
	const sortedResult = sortBooks(filteredResult, payload.sorting, userData?.productsLanguage, userData?.language);
	const total = sortedResult?.length;
	const paginatedResults = sortedResult?.slice(offset, offset + limit);

	if (paginatedResults.length > 0) {
		return {
			page,
			limit,
			success: true,
			message: "Books retrieved successfully",
			total: total,
			data: paginatedResults,
		};
	} else {
		return {
			data: [],
			page,
			limit,
			success: false,
			message: "No books found",
			total: 0,
		};
	}
};
export const getAllFaviouriteBooksService = async (user: any, payload: any) => {
	const page = parseInt(payload.page as string) || 1;
	const limit = parseInt(payload.limit as string) || 100;
	const offset = (page - 1) * limit;
	const userData = await usersModel.findById(user.id);
	const favBooks = await favoritesModel
		.find({
			userId: user.id,
		})
		.populate({
			path: "productId",
			populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
		});
	//TODO-- CHANGED
	// const modifiedResults = favBooks.filter((item: any) => {
	//   return item.productId.type === "e-book";
	// });
	const modifiedResults = favBooks.filter((item: any) => {
		return item?.productId?.type === "audio&ebook" && item?.productId?.format !== "audiobook";
	});
	const languages = toArray(payload.language);
	const filteredResult = filterBooksByLanguage(modifiedResults, languages);
	const sortedResult = sortBooks(filteredResult, payload.sorting, userData?.productsLanguage, userData?.language);
	const total = modifiedResults.length;
	const paginatedResults = modifiedResults.slice(offset, offset + limit);

	if (favBooks.length > 0) {
		return {
			page,
			limit,
			success: true,
			message: "Books retrieved successfully",
			total: total,
			data: paginatedResults,
		};
	} else {
		return {
			data: [],
			page,
			limit,
			success: false,
			message: "No books found",
			total: 0,
		};
	}
};

export const getCoursesBookRoomService = async (user: any, payload: any) => {
	const page = parseInt(payload.page as string) || 1;
	const limit = parseInt(payload.limit as string) || 100;
	const offset = (page - 1) * limit;
	const userData = await usersModel.findById(user.id);
	let results: any[] = [];
	let total = 0;

	switch (payload?.type) {
		case "fav":
			const favCourses = await favoritesModel.find({ userId: user.id }).populate({
				path: "productId",
				populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
			});

			const filteredCourses = favCourses.filter((item: any) => item?.productId?.type === "course");
			const languages = toArray(payload.language);
			// const filteredResult = filterBooksByLanguage(filteredCourses, languages);
			const sortedResult = sortBooks(filteredCourses, payload.sorting, userData?.productsLanguage, userData?.language);

			results = sortedResult.map((book) => ({
				...book.toObject(),
				isFavorite: true,
			}));
			break;

		case "completed":
			const completedCourses = await readProgressModel.find({ userId: user.id,  progress:  100  , isCompleted:  true }).populate({
				path: "bookId",
				populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
			});
			results = completedCourses?.filter((item: any) => {
				return item?.bookId?.type === "course";
			});

			break;

		case "studying":
			const studyingCourses = await readProgressModel.find({ userId: user.id,$or: [{ progress:  { $ne: 100 } }, { isCompleted:  false }]}).populate({
				path: "bookId",
				populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
			});
			results = studyingCourses?.filter((item: any) => {
				return item?.bookId?.type === "course";
			});

			break;

		case "certificate":
			const certCourses = await readProgressModel.find({ userId: user.id, progress: 100 }).populate("bookId");
			const certFilteredCourses = certCourses.filter((item: any) => item?.bookId?.type === "course" && item?.certificatePng !== null && item.certificatePdf !== null);
			const certificates = certFilteredCourses.map((item: any) => ({ certificatePng: item.certificatePng, certificatePdf: item.certificatePdf, bookId: { name: item.bookId.name, _id: item.bookId._id } }));
			return { success: true, message: "Certificate action logged", data: certificates };

		case "podcast":
			const completedPodcast = await readProgressModel.find({ userId: user.id }).populate({
				path: "bookId",
				populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
			});
			results = completedPodcast?.filter((item: any) => {
				return item?.bookId?.type === "podcast";
			});
			break;

		case "video-lecture":
			const completedVideoLecture = await readProgressModel.find({ userId: user.id }).populate({
				path: "bookId",
				populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
			});
			results = completedVideoLecture?.filter((item: any) => {
				return item?.bookId?.type === "video-lecture";
			});
			break;

		default:
			return { success: false, message: "Invalid type", data: [] };
	}

	total = results.length;
	const paginatedResults = results.slice(offset, offset + limit);

	return {
		page,
		limit,
		success: total > 0,
		message: total > 0 ? "Data retrieved successfully" : "No data found",
		total,
		data: paginatedResults,
	};
};
