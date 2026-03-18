import { z } from "zod";

const optionalNonEmptyString = z
    .union([z.string(), z.undefined()])
    .transform((value) => (typeof value === "string" ? value.trim() : value))
    .refine((value) => value === undefined || value.length > 0, {
        message: "must be a non-empty string",
    });

const requiredNameSchema = z
    .string()
    .trim()
    .min(1, "name is required");

const imageIdParamSchema = z.object({
    id: z.coerce.number().int().positive("Invalid id"),
});

const imageTagParamSchema = z.object({
    id: z.coerce.number().int().positive("Invalid id"),
    tagId: z.coerce.number().int().positive("Invalid tagId"),
});

const imageListQuerySchema = z.object({
    categoryId: z.coerce.number().int().positive().optional(),
    tagId: z.coerce.number().int().positive().optional(),
});

const imageSearchQuerySchema = z.object({
    search: z.string().trim().optional(),
});

const imageByTagsQuerySchema = z.object({
    id: z.string().trim().optional(),
    ids: z.string().trim().optional(),
});

const createImageSchema = z.object({
    name: requiredNameSchema,
    url: z.string().optional(),
    categoryId: z.coerce.number().int().positive("categoryId is required"),
    tagIds: z.array(z.coerce.number().int().positive("tagIds must be numbers")).optional(),
});

const updateImageSchema = z
    .object({
        name: optionalNonEmptyString,
        url: optionalNonEmptyString,
        categoryId: z.coerce.number().int().positive().optional(),
        tagIds: z.array(z.coerce.number().int().positive("tagIds must be numbers")).optional(),
    })
    .refine(
        (data) =>
            data.name !== undefined ||
            data.url !== undefined ||
            data.categoryId !== undefined ||
            data.tagIds !== undefined,
        { message: "At least one field is required" }
    );

const uploadImageBodySchema = z.object({
    imageId: z.coerce.number().int().positive("imageId is required"),
});

const addImageTagsSchema = z.object({
    tagIds: z.array(z.coerce.number().int().positive("tagIds must be numbers")).min(1, "tagIds must be a non-empty array"),
});

export {
    imageIdParamSchema,
    imageTagParamSchema,
    imageListQuerySchema,
    imageSearchQuerySchema,
    imageByTagsQuerySchema,
    createImageSchema,
    updateImageSchema,
    uploadImageBodySchema,
    addImageTagsSchema,
};
