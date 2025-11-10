import { Response } from "express";
import { errorResponseHandler } from "../../lib/errors/error-response-handler";
import { httpStatusCode } from "../../lib/constant";
import { bookMastersModel } from "../../models/book-masters/book-masters-schema";
import { productsModel } from "../../models/products/products-schema"; // Import productsModel
import { favoritesModel } from "src/models/product-favorites/product-favorites-schema";
import { readProgressModel } from "src/models/user-reads/read-progress-schema";
import { categoriesModel } from "src/models/categories/categroies-schema";
import { authorsModel } from "src/models/authors/authors-schema";
import { sortBooks } from "src/utils";
import { usersModel } from "src/models/user/user-schema";

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

    return {
      success: true,
      message: "Books added to bookMaster successfully",
      createdDocuments,
    }; // Return an array of created documents
  } catch (error) {
    console.error("Error adding books to bookMaster:", error);
    throw new Error("Failed to add books to bookMaster");
  }
};

export const getAvailableProductsService = async (res: Response) => {
  try {
    const bookMasters = await bookMastersModel.find().select("productsId");
    const bookMasterProductIds = bookMasters.flatMap((bookMaster) => bookMaster.productsId);

    const availableProducts = await productsModel.find({
      _id: { $nin: bookMasterProductIds },
      type: "video-lecture",
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
    populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
  });
  if (!bookMaster) return errorResponseHandler("Book master not found", httpStatusCode.NOT_FOUND, res);
  return {
    success: true,
    message: "Book master retrieved successfully",
    data: bookMaster,
  };
};

export const getAllBookMastersService = async (payload: any) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;

  const query: any = {};

  const sort: any = {};
  if (payload.orderColumn && payload.order) {
    sort[payload.orderColumn] = payload.order === "asc" ? 1 : -1;
  }

  const results = await bookMastersModel
  .find(query)
    .sort({
      createdAt: -1,
    })
    .skip(offset)
    .limit(limit)
    .select("-__v")
    .populate({
      path: "productsId",
      populate: [{ path: "authorId" }, { path: "categoryId" }, { path: "subCategoryId" }, { path: "publisherId" }],
    })
    .lean();

  let filteredResults = results;
  let totalDataCount;
  totalDataCount = await bookMastersModel.countDocuments();
  if (payload.description) {
    const searchQuery = payload.description;
    const searchLanguage = payload.language && ['eng', 'kaz', 'rus'].includes(payload.language) ? payload.language : null;

    filteredResults = results.filter((book) => {
      try {
        const product = book.productsId as any;

        // Handle case when product is null or undefined
        if (!product) {
          return false;
        }

        // Handle case when product is an array
        if (Array.isArray(product)) {
          // If product is an array, check each product in the array
          return product.some(prod => {
            try {
              // Extract product names based on language
              let prodNames: string[] = [];
              if (searchLanguage && prod?.name && typeof prod.name === 'object') {
                // Search only in the specified language
                const langValue = prod.name[searchLanguage];
                prodNames = langValue ? [String(langValue)] : [];
              } else if (prod?.name) {
                // Search in all languages
                prodNames = Object.values(prod.name).map(val => String(val || ''));
              }

              // Extract author names based on language
              const authors = prod?.authorId || [];
              let authNames: string[] = [];

              if (Array.isArray(authors)) {
                if (searchLanguage) {
                  // Search only in the specified language for each author
                  authNames = authors.flatMap(author => {
                    if (author && author.name && typeof author.name === 'object') {
                      const langValue = author.name[searchLanguage];
                      return langValue ? [String(langValue)] : [];
                    }
                    return [];
                  });
                } else {
                  // Search in all languages for each author
                  authNames = authors.flatMap(author =>
                    author && author.name ? Object.values(author.name).map(val => String(val || '')) : []
                  );
                }
              }

              // Check if any name includes the search query
              return prodNames.some(name =>
                  typeof name === 'string' &&
                  typeof searchQuery === 'string' &&
                  name.toLowerCase().includes(searchQuery.toLowerCase())
                ) ||
                authNames.some(name =>
                  typeof name === 'string' &&
                  typeof searchQuery === 'string' &&
                  name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            } catch (err) {
              console.error('Error processing product in array:', err);
              return false;
            }
          });
        }

        // Extract product names based on language
        let productNames: string[] = [];
        if (searchLanguage && product?.name && typeof product.name === 'object') {
          // Search only in the specified language
          const langValue = product.name[searchLanguage];
          productNames = langValue ? [String(langValue)] : [];
        } else if (product?.name) {
          // Search in all languages
          productNames = Object.values(product.name).map(val => String(val || ''));
        }

        // Extract author names based on language
        const authors = product?.authorId || [];
        let authorNames: string[] = [];

        if (Array.isArray(authors)) {
          if (searchLanguage) {
            // Search only in the specified language for each author
            authorNames = authors.flatMap(author => {
              if (author && author.name && typeof author.name === 'object') {
                const langValue = author.name[searchLanguage];
                return langValue ? [String(langValue)] : [];
              }
              return [];
            });
          } else {
            // Search in all languages for each author
            authorNames = authors.flatMap(author =>
              author && author.name ? Object.values(author.name).map(val => String(val || '')) : []
            );
          }
        }

        // Check if any name includes the search query
        const result = productNames.some(name =>
            typeof name === 'string' &&
            typeof searchQuery === 'string' &&
            name.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          authorNames.some(name =>
            typeof name === 'string' &&
            typeof searchQuery === 'string' &&
            name.toLowerCase().includes(searchQuery.toLowerCase())
          );

        return result;
      } catch (error) {
        console.error('Error in search filter:', error, 'for book:', book);
        return false;
      }
    });
    totalDataCount = filteredResults.length;
  }
  return {
    page,
    limit,
    message: "Book masters retrieved successfully",
    success: filteredResults.length > 0,
    total: filteredResults.length > 0 ? totalDataCount : 0,
    data: filteredResults,
  };
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
    message: "Book master Deleted successfully",
    data: deletedBookMaster,
  };
};
export const getBookMasterCategoryService = async (user: any, payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;


  const bookStudy = await bookMastersModel.find().populate({
    path: "productsId",
    populate: [
      { path: "authorId" },
      { path: "categoryId" },
      { path: "subCategoryId" },
      { path: "publisherId" },
    ],
  });

  if (!bookStudy) {
    return errorResponseHandler("Book study not found", httpStatusCode.NOT_FOUND, res);
  }


  let categories: any[] = [];

  bookStudy.forEach((study:any) => {
    if (study.productsId) {
      if (!Array.isArray(study.productsId)) {
        // If productsId is a single object
        if (study.productsId.categoryId) {
          categories.push(...study.productsId.categoryId);
        }
      } else {
        // If productsId is an array
        study.productsId.forEach((product: any) => {
          if (product && product.categoryId) {
            categories.push(...product.categoryId);
          }
        });
      }
    }
  });


  const uniqueCategories = categories.filter((value, index, self) =>
    index === self.findIndex((t) => (
      t && t._id && value && value._id && t._id.toString() === value._id.toString()
    ))
  );


  // Apply search filter if description is provided
  let filteredCategories = uniqueCategories;
  if (payload.description) {
    const searchQuery = typeof payload.description === 'string' ? payload.description.toLowerCase() : '';
    const searchLanguage = payload.language && ['eng', 'kaz', 'rus'].includes(payload.language) ? payload.language : null;


    filteredCategories = uniqueCategories.filter((category) => {
      try {
        if (!category || !category.name) {
          return false;
        }

        // Extract category names based on language
        let categoryNames: string[] = [];

        if (searchLanguage && category.name && typeof category.name === 'object') {
          // Search only in the specified language
          const langValue = category.name[searchLanguage];
          categoryNames = langValue ? [String(langValue).toLowerCase()] : [];
        } else if (category.name) {
          // Search in all languages
          categoryNames = Object.values(category.name)
            .filter(val => val !== null && val !== undefined)
            .map(val => String(val).toLowerCase());
        }

        // Check if any name includes the search query
        const result = categoryNames.some(name =>
          typeof name === 'string' && name.includes(searchQuery)
        );

        return result;
      } catch (error) {
        console.error('Error in search filter:', error, 'for category:', category);
        return false;
      }
    });
  }


  return {
    success: true,
    message: "Book Master categories retrieved successfully",
    data: { categories: filteredCategories },
  };
};


export const getBookMasterTeacherService = async (payload: any, user: any, res: Response) => {

  const bookStudy = await bookMastersModel.find({}).populate({
    path: "productsId",
    populate: [
      { path: "authorId" },
      { path: "categoryId" },
      { path: "subCategoryId" },
      { path: "publisherId" },
    ],
  });

  if (!bookStudy) {
    return errorResponseHandler("Book study not found", httpStatusCode.NOT_FOUND, res);
  }

  let authors: any[] = [];

  bookStudy.forEach((study:any) => {
    if (study.productsId && !Array.isArray(study.productsId)) {
      if (study.productsId.authorId) {
        authors.push(study.productsId.authorId);
      }
    } else if (Array.isArray(study.productsId)) {
      study.productsId.forEach((product: any) => {
        if (product && product.authorId) {
          authors.push(product.authorId);
        }
      });
    }
  });

  authors = authors.flat();

  const uniqueAuthors = Array.from(
    new Map(
      authors
        .filter((author: any) => author && author._id)  // Filter out authors without _id
        .map((author: any) => [author._id.toString(), author])  // Map to _id
    ).values()
  );


  // Apply search filter if description is provided
  let filteredAuthors = uniqueAuthors;
  if (payload.description) {
    const searchQuery = typeof payload.description === 'string' ? payload.description.toLowerCase() : '';
    const searchLanguage = payload.language && ['eng', 'kaz', 'rus'].includes(payload.language) ? payload.language : null;


    filteredAuthors = uniqueAuthors.filter((author) => {
      try {
        if (!author || !author.name) {
          return false;
        }

        // Extract author names based on language
        let authorNames: string[] = [];

        if (searchLanguage && author.name && typeof author.name === 'object') {
          // Search only in the specified language
          const langValue = author.name[searchLanguage];
          authorNames = langValue ? [String(langValue).toLowerCase()] : [];
        } else if (author.name) {
          // Search in all languages
          authorNames = Object.values(author.name)
            .filter(val => val !== null && val !== undefined)
            .map(val => String(val).toLowerCase());
        }

        // Check if any name includes the search query
        const result = authorNames.some(name =>
          typeof name === 'string' && name.includes(searchQuery)
        );

        return result;
      } catch (error) {
        console.error('Error in search filter:', error, 'for author:', author);
        return false;
      }
    });
  }

  return {
    success: true,
    message: "Book Master Authors retrieved successfully",
    data: { teachers: filteredAuthors },
  };
};

export const getPopularCoursesBookMasterService = async (payload: any, user: any, res: Response) => {

  const bookStudy = await bookMastersModel.find()
  .populate({
    path: "productsId",
    match: { averageRating: { $gte: 4, $lte: 5 } },
    populate: [
      { path: "authorId" },
      { path: "categoryId" },
      { path: "subCategoryId" },
      { path: "publisherId" },
    ],
  })
  .sort({
    "productsId.averageRating": 1,
  });
  const userData = await usersModel.findById(user.id);
const favoriteBooks = await favoritesModel.find({ userId: user.id }).populate("productId");
  const favoriteIds = favoriteBooks.map((book) => book.productId?._id.toString());
   let newBooksWithFavoriteStatus = bookStudy.map((book) => ({
     ...book.toObject(),
     isFavorite: favoriteIds.includes(book.productsId?._id.toString()),
     // isPurchased: true,
    }));

  const filteredBookStudy = newBooksWithFavoriteStatus.filter((study) => study.productsId !== null);
  const sortedResult = sortBooks(filteredBookStudy, payload.sorting, userData?.productsLanguage, userData?.language);


  // Apply search filter if description is provided
  let searchFilteredCourses = sortedResult;
  if (payload.description) {
    const searchQuery = typeof payload.description === 'string' ? payload.description.toLowerCase() : '';
    const searchLanguage = payload.language && ['eng', 'kaz', 'rus'].includes(payload.language) ? payload.language : null;


    searchFilteredCourses = sortedResult.filter((course) => {
      try {
        if (!course || !course.productsId) {
          return false;
        }

        const product = course.productsId as any;

        // Extract product names based on language
        let productNames: string[] = [];
        if (searchLanguage && product?.name && typeof product.name === 'object') {
          // Search only in the specified language
          const langValue = product.name[searchLanguage];
          productNames = langValue ? [String(langValue).toLowerCase()] : [];
        } else if (product?.name) {
          // Search in all languages
          productNames = Object.values(product.name)
            .filter(val => val !== null && val !== undefined)
            .map(val => String(val).toLowerCase());
        }

        // Extract author names if available
        let authorNames: string[] = [];
        if (product?.authorId && Array.isArray(product.authorId)) {
          if (searchLanguage) {
            // Search only in the specified language for each author
            authorNames = product.authorId.flatMap((author: any) => {
              if (author && author.name && typeof author.name === 'object') {
                const langValue = author.name[searchLanguage];
                return langValue ? [String(langValue).toLowerCase()] : [];
              }
              return [];
            });
          } else {
            // Search in all languages for each author
            authorNames = product.authorId.flatMap((author: any) =>
              author && author.name ? Object.values(author.name)
                .filter(val => val !== null && val !== undefined)
                .map(val => String(val).toLowerCase()) : []
            );
          }
        }

        // Check if any name includes the search query
        const result = productNames.some(name =>
            typeof name === 'string' && name.includes(searchQuery)
          ) ||
          authorNames.some(name =>
            typeof name === 'string' && name.includes(searchQuery)
          );

        return result;
      } catch (error) {
        console.error('Error in search filter:', error, 'for course:', course);
        return false;
      }
    });
  }

  return {
    success: true,
    message: "Book Master popular courses retrieved successfully",
    data: { popularCourses: searchFilteredCourses },
  };
};

export const getBookMasterNewbookService = async (user: any, payload: any, res: Response) => {

  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * 20;

  const today = new Date();

  const sixMonthsAgo = new Date(today.setMonth(today.getMonth() - 6));
  const totalDataCount = await bookMastersModel.countDocuments({
    createdAt: { $gte: sixMonthsAgo }
  });
  

  const newBooks = await bookMastersModel.find({
    createdAt: { $gte: sixMonthsAgo }
  })
    .populate({
      path: "productsId",
      populate: [
        { path: "authorId" },
        { path: "categoryId" },
        { path: "subCategoryId" },
        { path: "publisherId" },
      ],
    })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);


  const favoriteBooks = await favoritesModel.find({ userId: user.id }).populate("productId");
  const favoriteIds = favoriteBooks
    .filter((book) => book.productId && book.productId._id)
    .map((book) => book.productId._id.toString());
  const userData = await usersModel.findById(user.id);

  const sortedResult = sortBooks(newBooks, payload.sorting, userData?.productsLanguage, userData?.language);

  let newBooksWithFavoriteStatus = sortedResult.map((book) => ({
    ...book.toObject(),
    isFavorite: favoriteIds.includes(book.productsId?._id.toString()),
  }));


  // Apply search filter if description is provided
  if (payload.description) {
    const searchQuery = typeof payload.description === 'string' ? payload.description.toLowerCase() : '';
    const searchLanguage = payload.language && ['eng', 'kaz', 'rus'].includes(payload.language) ? payload.language : null;


    newBooksWithFavoriteStatus = newBooksWithFavoriteStatus.filter((book) => {
      try {
        const product = book.productsId as any;

        // Handle case when product is null or undefined
        if (!product) {
          return false;
        }

        // Handle case when product is an array
        if (Array.isArray(product)) {
          // If product is an array, check each product in the array
          return product.some(prod => {
            try {
              // Extract product names based on language
              let prodNames: string[] = [];
              if (searchLanguage && prod?.name && typeof prod.name === 'object') {
                // Search only in the specified language
                const langValue = prod.name[searchLanguage];
                prodNames = langValue ? [String(langValue).toLowerCase()] : [];
              } else if (prod?.name) {
                // Search in all languages
                prodNames = Object.values(prod.name)
                  .filter(val => val !== null && val !== undefined)
                  .map(val => String(val).toLowerCase());
              }

              // Extract author names based on language
              const authors = prod?.authorId || [];
              let authNames: string[] = [];

              if (Array.isArray(authors)) {
                if (searchLanguage) {
                  // Search only in the specified language for each author
                  authNames = authors.flatMap(author => {
                    if (author && author.name && typeof author.name === 'object') {
                      const langValue = author.name[searchLanguage];
                      return langValue ? [String(langValue).toLowerCase()] : [];
                    }
                    return [];
                  });
                } else {
                  // Search in all languages for each author
                  authNames = authors.flatMap(author =>
                    author && author.name ? Object.values(author.name)
                      .filter(val => val !== null && val !== undefined)
                      .map(val => String(val).toLowerCase()) : []
                  );
                }
              }

              // Check if any name includes the search query
              const prodMatch = prodNames.some(name =>
                  typeof name === 'string' && name.includes(searchQuery)
                );
              const authMatch = authNames.some(name =>
                  typeof name === 'string' && name.includes(searchQuery)
                );

              return prodMatch || authMatch;
            } catch (err) {
              console.error('Error processing product in array:', err);
              return false;
            }
          });
        }

        // Extract product names based on language
        let productNames: string[] = [];
        if (searchLanguage && product?.name && typeof product.name === 'object') {
          // Search only in the specified language
          const langValue = product.name[searchLanguage];
          productNames = langValue ? [String(langValue).toLowerCase()] : [];
        } else if (product?.name) {
          // Search in all languages
          productNames = Object.values(product.name)
            .filter(val => val !== null && val !== undefined)
            .map(val => String(val).toLowerCase());
        }

        // Extract author names based on language
        const authors = product?.authorId || [];
        let authorNames: string[] = [];

        if (Array.isArray(authors)) {
          if (searchLanguage) {
            // Search only in the specified language for each author
            authorNames = authors.flatMap(author => {
              if (author && author.name && typeof author.name === 'object') {
                const langValue = author.name[searchLanguage];
                return langValue ? [String(langValue).toLowerCase()] : [];
              }
              return [];
            });
          } else {
            // Search in all languages for each author
            authorNames = authors.flatMap(author =>
              author && author.name ? Object.values(author.name)
                .filter(val => val !== null && val !== undefined)
                .map(val => String(val).toLowerCase()) : []
            );
          }
        }

        // Check if any name includes the search query
        const prodMatch = productNames.some(name =>
            typeof name === 'string' && name.includes(searchQuery)
          );
        const authMatch = authorNames.some(name =>
            typeof name === 'string' && name.includes(searchQuery)
          );

        return prodMatch || authMatch;
      } catch (error) {
        console.error('Error in search filter:', error, 'for book:', book);
        return false;
      }
    });

  }

  return {
    success: true,
    message: "Books retrieved successfully",
    page,
    limit,
    total: payload.description ? newBooksWithFavoriteStatus.length : totalDataCount,
    data: {
      newBooks: newBooksWithFavoriteStatus,
    },
  };
};
export const getBookMasterReadProgressService = async (user: any, payload: any, res: Response) => {
  const Books = await bookMastersModel.find({});
  const bookIds = Books.map(book => book.productsId);

  const readProgress = await readProgressModel.find({
    userId: user.id,
    bookId: { $in: bookIds }
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


  return {
    success: true,
    message: "Books retrieved successfully",
    data: {
      readBooks: readProgress,
    },
  };
};

export const getBookMastersForUserService = async (user: any, payload: any, res: Response) => {
  // const readProgress = await getBookMasterReadProgressService(user, payload, res);
  const newBook = await getBookMasterNewbookService(user, payload, res);

  const teachers = await getBookMasterTeacherService(payload, user, res);

  const categories = await getBookMasterCategoryService(user, payload, res);

  const popularCourses = await getPopularCoursesBookMasterService(payload, user, res);

  return {
    success: true,
    message: "Book Master retrieved successfully",
    data: {
      // readBooks: readProgress.data.readBooks,
      newBooks: newBook.data.newBooks,
      teachers: teachers.data.teachers,
      categories: categories.data.categories,
      popularCourses: popularCourses.data.popularCourses
    },
  };
};
export const getBookMarketCategoryService = async (user: any, payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;

 const categories = await categoriesModel.find({ module: "bookMarket" });
 

  return {
    success: true,
    message: "Book Market categories retrieved successfully",
    data: {categories: categories },
  };
};
export const getBookMarketAuthorService = async (user: any, payload: any, res: Response) => {
  const page = parseInt(payload.page as string) || 1;
  const limit = parseInt(payload.limit as string) || 0;
  const offset = (page - 1) * limit;

 const author = await authorsModel.find({ category: "bookMarket" });
 
  return {
    success: true,
    message: "Book Market authors retrieved successfully",
    data: { authors: author },
  };
};