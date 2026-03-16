import {z} from "zod";

const createCategorySchema = z.object({
    name: z.string().min(3,"Category name must be at least 3 characters long").trim()
    .nonempty("Category name is required"),
});

const updateCategorySchema = z.object({
    name: z.string().min(3,"Category name must be at least 3 characters long").trim()
    .nonempty("Category name is required"),
});

export { createCategorySchema, updateCategorySchema };