import { readProgressModel } from "src/models/user-reads/read-progress-schema";
import { favoritesModel } from "src/models/product-favorites/product-favorites-schema";
import { query } from "express";

export const getAllReadingBooksService = async (user: any, payload: any) => {
	const page = parseInt(payload.page as string) || 1;
	const limit = parseInt(payload.limit as string) || 10;
	const offset = (page - 1) * limit;

	const readingBooks = await readProgressModel
		.find({
			userId: user.id,
			progress: { $lt: 100 },
		})
		.populate({
			path: "bookId",
			populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
		});
	//TODO--CHANGED
	// const modifiedResults = readingBooks.filter((item: any) => item.bookId.type === "e-book");
	const modifiedResults = readingBooks.filter((item: any) => item.bookId.type === "audio&ebook" && item.bookId.format !== "audiobook");
	const total = modifiedResults.length;
	const paginatedResults = modifiedResults.slice(offset, offset + limit);

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
	const limit = parseInt(payload.limit as string) || 10;
	const offset = (page - 1) * limit;

	const finishedBooks = await readProgressModel
		.find({
			userId: user.id,
			progress: { $eq: 100 },
		})
		.populate({
			path: "bookId",
			populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
		});
	//TODO--CHANGED
	// const modifiedResults = finishedBooks.filter((item: any) => item.bookId.type === "e-books");
	const modifiedResults = finishedBooks.filter((item: any) => item.bookId.type === "audio&ebook" && item.bookId.format !== "audiobook");
	const total = modifiedResults.length;
	const paginatedResults = modifiedResults.slice(offset, offset + limit);

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
	const limit = parseInt(payload.limit as string) || 10;
	const offset = (page - 1) * limit;

	const favBooks = await favoritesModel
		.find({
			userId: user.id,
		})
		.populate({
			path: "productId",
			populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
		});
	console.log("favBooks: ", favBooks);
	//TODO-- CHANGEDE
	// const modifiedResults = favBooks.filter((item: any) => {
	//   return item.productId.type === "e-book";
	// });
	const modifiedResults = favBooks.filter((item: any) => {
		return item.productId.type === "audio&ebook" && item.productId.format !== "audiobook";
	});

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
	const limit = parseInt(payload.limit as string) || 10;
	const offset = (page - 1) * limit;

	let results: any[] = [];
	let total = 0;

	switch (payload.type) {
		case "fav":
			const favCourses = await favoritesModel.find({ userId: user.id }).populate({
				path: "productId",
				populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
			});

			const filteredCourses = favCourses.filter((item: any) => item.productId.type === "course");
			results = filteredCourses.map((book) => ({
				...book.toObject(),
				isFavorite: true,
			}));
			break;

		case "completed":
			const completedCourses = await readProgressModel.find({ userId: user.id, progress: 100 }).populate("bookId");
			results = completedCourses.filter((item: any) => {
				item.bookId.type === "course";
			});

			break;

		case "studying":
			const studyingCourses = await readProgressModel.find({ userId: user.id, progress: { $ne: 100 } }).populate("bookId");
			results = studyingCourses.filter((item: any) => item.bookId.type === "course");

			break;

		case "certificate":
			const certCourses = await readProgressModel.find({ userId: user.id, progress: 100 }).populate("bookId");
			const certFilteredCourses = certCourses.filter((item: any) => item.bookId.type === "course" && item.certificatePng !== null && item.certificatePdf !== null);
			console.log("certCourses: ", certCourses);
			console.log("certFilteredCourses: ", certFilteredCourses);
			const certificates = certFilteredCourses.map((item: any) => ({ certificatePng: item.certificatePng, certificatePdf: item.certificatePdf }));
			return { success: true, message: "Certificate action logged", data: certificates };

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
