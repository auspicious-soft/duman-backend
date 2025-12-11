import { readProgressModel } from "src/models/user-reads/read-progress-schema";
import { favoritesModel } from "src/models/product-favorites/product-favorites-schema";
import { query } from "express";
import { filterBooksByLanguage, sortBooks, toArray } from "src/utils";
import { usersModel } from "src/models/user/user-schema";

// export const getAllReadingBooksService = async (user: any, payload: any) => {
// 	console.log('payload: ', payload);
// 	console.log('user: ', user);
// 	const page = parseInt(payload.page as string) || 1;
// 	const limit = parseInt(payload.limit as string) || 100;
// 	const offset = (page - 1) * limit;
// 	const userData = await usersModel.findById(user.id);
// 	let readingBooks = await readProgressModel
// 		.find({
// 			userId: user.id,
// 			$and: [{ progress: { $lt: 100} }, { audiobookProgress: { $lt: 100 } }],
// 		})
// 		.populate({
// 			path: "bookId",
// 			populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
// 		});
// 	//TODO--CHANGED
// 	//TODO--need to be tested
// readingBooks = readingBooks.filter((item: any) => item?.bookId?.type === "audio&ebook");
//   console.log('readingBooks: ', readingBooks);

//   // Convert language input to array
//   const languages = toArray(payload.language);

//   // Wrap readingBooks for sorting/filtering without losing original structure
//   const wrappedBooks = readingBooks.map(item => ({ original: item, book: item.bookId }));

//   // Filter books by language
//   let filteredWrappedBooks = filterBooksByLanguage(
//     wrappedBooks.map(w => w.book),
//     languages
//   ).map(fBook =>
//     wrappedBooks.find(w => w.book._id.toString() === fBook._id.toString())!
//   );

//   // Sort books
//   const sortedWrappedBooks = sortBooks(
//     filteredWrappedBooks.map(w => w.book),
//     payload.sorting,
//     userData?.productsLanguage,
//     userData?.language
//   ).map(sortedBook =>
//     filteredWrappedBooks.find(w => w.book._id.toString() === sortedBook._id.toString())!
//   );

//   // Map back to original readingBooks structure
//   const finalReadingBooks = sortedWrappedBooks.map(w => w.original);

//   console.log('finalReadingBooks: ', finalReadingBooks);

//   // Pagination
//   const total = finalReadingBooks.length;
//   const paginatedResults = finalReadingBooks.slice(offset, offset + limit);

//   if (paginatedResults.length > 0) {
//     return {
//       page,
//       limit,
//       success: true,
//       message: "Books retrieved successfully",
//       total: total,
//       data: paginatedResults,
//     };
//   } else {
//     return {
//       data: [],
//       page,
//       limit,
//       success: false,
//       message: "No books found",
//       total: 0,
//     };
//   }
// };



export const getAllReadingBooksService = async (user: any, payload: any) => {
	console.log('payload: ', payload);
	console.log('user: ', user);

	const page = parseInt(payload.page as string) || 1;
	const limit = parseInt(payload.limit as string) || 100;
	const offset = (page - 1) * limit;

	const userData = await usersModel.findById(user.id);

	let readingBooks = await readProgressModel
		.find({
			userId: user.id,
			$and: [
				{ progress: { $lt: 100, $gte: 0 } },
				{ audiobookProgress: { $lt: 100, $gte: 0 } }
			],
		})
		.populate({
			path: "bookId",
			populate: [
				{ path: "authorId" },
				{ path: "categoryId" },
				{ path: "subCategoryId" },
				{ path: "publisherId" },
			],
		});

	// Filter only audio&ebook type
	readingBooks = readingBooks.filter((item: any) => item?.bookId?.type === "audio&ebook");
	console.log('readingBooks after type filter: ', readingBooks);

	// Convert language input to array
	const languages = toArray(payload.language);

	// Wrap readingBooks for sorting/filtering without losing original structure
	const wrappedBooks = readingBooks.map(item => ({ original: item, book: item.bookId }));

	// Filter books by language
	let filteredWrappedBooks = filterBooksByLanguage(
		wrappedBooks.map(w => w.book),
		languages
	).map(fBook =>
		wrappedBooks.find(w => w.book._id.toString() === fBook._id.toString())!
	);

	// Sort books
	const sortedWrappedBooks = sortBooks(
		filteredWrappedBooks.map(w => w.book),
		payload.sorting,
		userData?.productsLanguage,
		userData?.language
	).map(sortedBook =>
		filteredWrappedBooks.find(w => w.book._id.toString() === sortedBook._id.toString())!
	);

	// Map back to original readingBooks structure
	let finalReadingBooks = sortedWrappedBooks.map(w => {
		// Add max progress between progress and audiobookProgress
		const maxProgress = Math.max(w.original.progress, w.original.audiobookProgress);
		return { ...w.original.toObject(), progress: maxProgress };
	});

	console.log('finalReadingBooks with max progress: ', finalReadingBooks);

	// Pagination
	const total = finalReadingBooks.length;
	const paginatedResults = finalReadingBooks.slice(offset, offset + limit);

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

  // Get user data
  const userData = await usersModel.findById(user.id);

  // Fetch finished books (progress = 100 or audiobookProgress = 100)
  let finishedBooks = await readProgressModel
  .find({
	  userId: user.id,
      $or: [{ progress: { $eq: 100 } }, { audiobookProgress: { $eq: 100 } }],
    })
    .populate({
		path: "bookId",
		populate: [
			{ path: "authorId" },
			{ path: "categoryId" },
			{ path: "subCategoryId" },
			{ path: "publisherId" },
		],
    });
	
  // Filter only books of type "audio&ebook"
  finishedBooks = finishedBooks.filter((item: any) => item?.bookId?.type === "audio&ebook");

  // Convert language input to array
  const languages = toArray(payload.language);

  // Wrap books for sorting/filtering without losing original structure
  const wrappedBooks = finishedBooks.map(item => ({ original: item, book: item.bookId }));

  // Filter books by language
  let filteredWrappedBooks = filterBooksByLanguage(
    wrappedBooks.map(w => w.book),
    languages
  ).map(fBook =>
    wrappedBooks.find(w => w.book._id.toString() === fBook._id.toString())!
  );

  // Sort books
  const sortedWrappedBooks = sortBooks(
    filteredWrappedBooks.map(w => w.book),
    payload.sorting,
    userData?.productsLanguage,
    userData?.language
  ).map(sortedBook =>
    filteredWrappedBooks.find(w => w.book._id.toString() === sortedBook._id.toString())!
  );

  // Map back to original structure
  const finalFinishedBooks = sortedWrappedBooks.map(w => w.original);

  // Pagination
  const total = finalFinishedBooks.length;
  const paginatedResults = finalFinishedBooks.slice(offset, offset + limit);

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

  // Fetch user data
  const userData = await usersModel.findById(user.id);

  // Fetch favorite books
  let favBooks:any = await favoritesModel
    .find({ userId: user.id })
    .populate({
      path: "productId",
      populate: [
        { path: "authorId" },
        { path: "categoryId" },
        { path: "subCategoryId" },
        { path: "publisherId" },
      ],
    });

  // Filter only audio & ebook type books (exclude pure audiobooks)
  favBooks = favBooks.filter(
    (item: any) => item?.productId?.type === "audio&ebook" && item?.productId?.format !== "audiobook"
  );

  const languages = toArray(payload.language);

  // Wrap books for sorting/filtering without losing original structure
  const wrappedBooks = favBooks.map((item: any) => ({ original: item, book: item.productId }));

  // Filter by language
  let filteredWrappedBooks = filterBooksByLanguage(
    wrappedBooks.map((w: any) => w.book),
    languages
  ).map(fBook => wrappedBooks.find((w:any) => w.book._id.toString() === fBook._id.toString())!);

  // Sort the filtered books
  const sortedWrappedBooks = sortBooks(
    filteredWrappedBooks.map(w => w.book),
    payload.sorting,
    userData?.productsLanguage,
    userData?.language
  ).map(sortedBook =>
    filteredWrappedBooks.find(w => w.book._id.toString() === sortedBook._id.toString())!
  );

  // Map back to original structure
  const finalFavBooks = sortedWrappedBooks.map(w => w.original);

  // Pagination
  const total = finalFavBooks.length;
  const paginatedResults = finalFavBooks.slice(offset, offset + limit);

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


export const getCoursesBookRoomService = async (user: any, payload: any) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 100;
  const offset = (page - 1) * limit;
  const userData = await usersModel.findById(user.id);

  let results: any[] = [];
  let total = 0;

  switch (payload?.type) {
    case "fav": {
      const favCourses = await favoritesModel.find({ userId: user.id }).populate({
        path: "productId",
        populate: [
          { path: "authorId" },
          { path: "categoryId" },
          { path: "subCategoryId" },
          { path: "publisherId" },
        ],
      });

      // Filter only courses
      let filteredCourses = favCourses.filter(
        (item: any) => item?.productId?.type === "course"
      );

      const languages = toArray(payload.language);

      // Wrap courses for sorting/filtering
      const wrappedCourses = filteredCourses.map(item => ({
        original: item,
        book: item.productId,
      }));

      // Sort using generic sortBooks
      const sortedWrappedCourses = sortBooks(
        wrappedCourses.map(w => w.book),
        payload.sorting,
        userData?.productsLanguage,
        userData?.language
      ).map(sortedBook =>
        wrappedCourses.find(w => w.book._id.toString() === sortedBook._id.toString())!
      );

      // Map back to original structure with isFavorite
      results = sortedWrappedCourses.map(w => ({
        ...w.original.toObject(),
        isFavorite: true,
      }));
      break;
    }

    case "completed":
    case "studying":
    case "podcast":
    case "video-lecture": {
      let query: any = { userId: user.id };
      if (payload.type === "completed") query.progress = 100;
      if (payload.type === "studying") query.$or = [{ progress: { $ne: 100 } }, { isCompleted: false }];

      const modelResults = await readProgressModel.find(query).populate({
        path: "bookId",
        populate: [
          { path: "authorId" },
          { path: "categoryId" },
          { path: "subCategoryId" },
          { path: "publisherId" },
        ],
      });

      const typeFilter = payload.type === "completed" || payload.type === "studying"
        ? "course"
        : payload.type === "podcast"
        ? "podcast"
        : "video-lecture";

      results = modelResults.filter((item: any) => item?.bookId?.type === typeFilter);
      break;
    }

    case "certificate": {
      const certCourses = await readProgressModel.find({ userId: user.id, progress: 100 }).populate("bookId");

      const certFilteredCourses = certCourses.filter(
        (item: any) =>
          item?.bookId?.type === "course" &&
          item?.certificatePng !== null &&
          item?.certificatePdf !== null
      );

      const certificates = certFilteredCourses.map((item: any) => ({
        certificatePng: item.certificatePng,
        certificatePdf: item.certificatePdf,
        bookId: { name: item.bookId.name, _id: item.bookId._id },
      }));

      return { success: true, message: "Certificate action logged", data: certificates };
    }

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
