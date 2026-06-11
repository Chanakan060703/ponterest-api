import express from "express";
import {
    addFavorite,
    getFavorites,
    removeFavorite,
} from "../controllers/favoriteController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { favoriteImageParamSchema } from "../validators/favoriteValidators.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getFavorites);
router.post("/:imageId", validateRequest(favoriteImageParamSchema, "params"), addFavorite);
router.delete("/:imageId", validateRequest(favoriteImageParamSchema, "params"), removeFavorite);

export default router;
