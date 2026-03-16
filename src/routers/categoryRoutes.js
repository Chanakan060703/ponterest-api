import express from "express";
import { createCategory, getCategories, updateCategory, deleteCategory } from "../controllers/categoryController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createCategorySchema, updateCategorySchema } from "../validators/categoryValidators.js";

const router = express.Router();

router.post("/",validateRequest(createCategorySchema),createCategory);

router.get("/",getCategories);

router.put("/:id",validateRequest(updateCategorySchema),updateCategory);

router.delete("/:id",deleteCategory);

export default router;