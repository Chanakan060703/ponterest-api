import express from "express";
import { createCategory, getCategories, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createCategorySchema, updateCategorySchema } from "../validators/categoryValidators.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/",getCategories);

router.post("/", authMiddleware, validateRequest(createCategorySchema), createCategory);

router.put("/:id", authMiddleware, validateRequest(updateCategorySchema), updateCategory);

router.delete("/:id", authMiddleware, deleteCategory);

export default router;
