import { httpStatusCode } from "src/lib/constant";
import { errorResponseHandler } from "src/lib/errors/error-response-handler";
import { Response } from "express";
import { getAllBannersService } from "../banners/banners-service";
import { getAllStoriesService } from "../stories/stories-service";
import { getAllCollectionsService, getAllCollectionsWithBooksService } from "../collections/collections-service";
import {  getAllBookLivesWithBlogsForHomeService, getAllBookLivesWithBlogsService } from "../book-lives/book-lives-service";
import { getAllBooksService, getAllProductsForStocksTabService } from "../products/products-service";

export const getHomePageService = async (payload: any, res: Response) => {
  try {
    const bannersResponse = await getAllBannersService(payload, res);
    const storiesResponse = await getAllStoriesService(payload, res);

    const banners = bannersResponse?.data?.length ? bannersResponse.data : [];
    const stories = storiesResponse?.data?.length ? storiesResponse.data : [];

    if (!banners.length && !stories.length) {
      return {
        success: false,
        message: "No content available for home page",
        data: {
          banners: [],
          stories: [],
        },
      };
    }

    return {
      success: true,
      message: "Home page data retrieved successfully",
      data: {
        banners,
        stories,
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
        const stocks = await getAllProductsForStocksTabService(payload,res);
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
        const blogs = await getAllBookLivesWithBlogsForHomeService(payload, res);
        return {
          success: true,
          message: "Blogs retrieved successfully",
          data: blogs.success ? blogs : [],
        };
      default: {
        const stocks = await getAllProductsForStocksTabService(payload,res);
        return {
          success: true,
          message: "Collections retrieved successfully",
          data: stocks.success ? stocks : [],
        };
      }
    }
  } catch (error: any) {
    return errorResponseHandler(error.message, httpStatusCode.INTERNAL_SERVER_ERROR, res);
  }
};
