import {z} from "zod";

const categoryIdParamSchema = z.object({
    id: z.coerce.number().int().positive("Invalid id"),
});

const createCategorySchema = z.object({
    name: z.string().min(3,"Category name must be at least 3 characters long").trim()
    .nonempty("Category name is required"),
});

const updateCategorySchema = z.object({
    name: z.string().min(3,"Category name must be at least 3 characters long").trim()
    .nonempty("Category name is required"),
});

export { createCategorySchema, updateCategorySchema, categoryIdParamSchema };
