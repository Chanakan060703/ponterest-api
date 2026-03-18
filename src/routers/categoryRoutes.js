import express from "express";
import { createCategory, getCategories, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { categoryIdParamSchema, createCategorySchema, updateCategorySchema } from "../validators/categoryValidators.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/",getCategories);

router.post("/", authMiddleware, validateRequest(createCategorySchema), createCategory);

router.put("/:id", authMiddleware, validateRequest(categoryIdParamSchema, "params"), validateRequest(updateCategorySchema), updateCategory);

router.delete("/:id", authMiddleware, validateRequest(categoryIdParamSchema, "params"), deleteCategory);

export default router;
