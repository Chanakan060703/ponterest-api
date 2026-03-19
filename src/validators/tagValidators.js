import { z } from "zod";

const nameSchema = z
    .string()
    .trim()
    .min(1, "name is required")
    .min(2, "name must be at least 2 characters long");

const tagIdParamSchema = z.object({
    id: z.coerce.number().int().positive("Invalid id"),
});

const createTagSchema = z.object({
    name: nameSchema,
});

const updateTagSchema = z.object({
    name: nameSchema,
});

export { createTagSchema, updateTagSchema, tagIdParamSchema };
