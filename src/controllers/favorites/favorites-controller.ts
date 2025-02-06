import { Request, Response } from "express";
import { httpStatusCode } from "src/lib/constant";
import { createFavoriteService, getFavoriteService, getAllFavoritesService, updateFavoriteService, deleteFavoriteService } from "src/services/favorites/favorites-service";

export const createFavorite = async (req: Request, res: Response) => {
    const user = req.user;
  const response = await createFavoriteService(req.body,user, res);
  return res.status(httpStatusCode.CREATED).json(response);
};

export const getFavorite = async (req: Request, res: Response) => {
    const user = req.user;
  const response = await getFavoriteService(req.params.id,user, res);
  return res.status(httpStatusCode.OK).json(response);
};

export const getAllFavorites = async (req: Request, res: Response) => {
  const user = req.user;
  const response = await getAllFavoritesService(req.query,user,res);
  return res.status(httpStatusCode.OK).json(response);
};

export const updateFavorite = async (req: Request, res: Response) => {
  const user = req.user;
  const response = await updateFavoriteService(user, req.body, res);
  return res.status(httpStatusCode.OK).json(response);
};

export const deleteFavorite = async (req: Request, res: Response) => {
  const user = req.user;
  const response = await deleteFavoriteService(user,req.params.id, res);
  return res.status(httpStatusCode.OK).json(response);
};
