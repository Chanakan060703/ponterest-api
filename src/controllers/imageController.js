import { prisma } from "../config/db.js";
import { deleteByPrefix, getCachedJson, setCachedJson } from "../config/redis.js";
import { uploadImageToS3 } from "../config/s3.js";
import { toHttpError } from "../utils/prismaErrors.js";

const IMAGE_CACHE_TTL_SECONDS = Number(process.env.IMAGE_CACHE_TTL_SECONDS) || 300;
const IMAGE_CACHE_PREFIX = "images:";

const parseId = (value) => {
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
};
const parseIdList = (raw) => {
    if (typeof raw !== "string" || raw.trim().length === 0) return null;
    const ids = raw
        .split(",")
        .map((value) => parseId(value.trim()))
        .filter((value) => value !== null);
    if (ids.length === 0) return null;
    return Array.from(new Set(ids));
};

const toCacheKeyPart = (value) => (value === null || value === undefined ? "all" : String(value));

const buildImageListCacheKey = (categoryId, tagId) =>
    `${IMAGE_CACHE_PREFIX}list:category=${toCacheKeyPart(categoryId)}:tag=${toCacheKeyPart(tagId)}`;


const buildImageDetailCacheKey = (id) => `${IMAGE_CACHE_PREFIX}detail:${id}`;


const invalidateImageCache = async () => {
    await deleteByPrefix(IMAGE_CACHE_PREFIX);
};


const mapImageTagsToTags = (imageTags) =>
    imageTags
        .filter((it) => it.isDeleted === false && it.tag?.isDeleted === false)
        .map((it) => it.tag);


const getImages = async (req, res) => {
    try {
        const categoryId = req.query.categoryId ? parseId(req.query.categoryId) : null;
        const tagId = req.query.tagId ? parseId(req.query.tagId) : null;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 10);
        const skip = (page - 1) * limit;

        if (req.query.categoryId && categoryId === null) {
            return res.status(400).json({ error: "Invalid categoryId" });
        }
        if (req.query.tagId && tagId === null) {
            return res.status(400).json({ error: "Invalid tagId" });
        }

        const where = {
            isDeleted: false,
            ...(categoryId !== null ? { categoryId } : {}),
            ...(tagId !== null
                ? {
                    imageTags: {
                        some: {
                            tagId,
                            isDeleted: false,
                            tag: { is: { isDeleted: false } },
                        },
                    },
                }
                : {}),
            category: { is: { isDeleted: false } },
        };

        const [images, totalCount] = await Promise.all([
            prisma.image.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    category: true,
                    imageTags: {
                        where: { isDeleted: false, tag: { is: { isDeleted: false } } },
                        include: { tag: true },
                    },
                },
            }),
            prisma.image.count({ where }),
        ]);

        const data = images.map((img) => ({
            ...img,
            tags: mapImageTagsToTags(img.imageTags),
            imageTags: undefined,
        }));

        const responseBody = {
            status: "success",
            message: "Images fetched successfully",
            data: { 
                images: data,
                pagination: {
                    currentPage: page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    hasNextPage: page < Math.ceil(totalCount / limit),
                }
            },
        };

        return res.status(200).json(responseBody);
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const searchImages = async (req, res) => {
    try {
        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
        const baseWhere = {
            isDeleted: false,
            category: { is: { isDeleted: false } },
        };
        const where = search
            ? {
                ...baseWhere,
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { category: { is: { name: { contains: search, mode: "insensitive" }, isDeleted: false } } },
                    {
                        imageTags: {
                            some: {
                                isDeleted: false,
                                tag: {
                                    is: {
                                        isDeleted: false,
                                        name: { contains: search, mode: "insensitive" },
                                    },
                                },
                            },
                        },
                    },
                ],
            }
            : baseWhere;

        const images = await prisma.image.findMany({
            where,
            include: {
                category: true,
                imageTags: {
                    where: { isDeleted: false, tag: { is: { isDeleted: false } } },
                    include: { tag: true },
                },
            },
        });

        const data = images.map((img) => ({
            ...img,
            tags: mapImageTagsToTags(img.imageTags),
            imageTags: undefined,
        }));

        return res.status(200).json({
            status: "success",
            message: "Images searched successfully",
            data: { images: data },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const getImageById = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (id === null) return res.status(400).json({ error: "Invalid id" });

        const cacheKey = buildImageDetailCacheKey(id);
        const cachedResponse = await getCachedJson(cacheKey);
        if (cachedResponse) {
            return res.status(200).json(cachedResponse);
        }

        const image = await prisma.image.findFirst({
            where: { id, isDeleted: false, category: { is: { isDeleted: false } } },
            include: {
                category: true,
                imageTags: {
                    where: { isDeleted: false, tag: { is: { isDeleted: false } } },
                    include: { tag: true },
                },
            },
        });

        if (!image) return res.status(404).json({ error: "Image not found" });

        const responseBody = {
            status: "success",
            message: "Image fetched successfully",
            data: {
                image: {
                    ...image,
                    tags: mapImageTagsToTags(image.imageTags),
                    imageTags: undefined,
                },
            },
        };

        await setCachedJson(cacheKey, responseBody, IMAGE_CACHE_TTL_SECONDS);
        return res.status(200).json(responseBody);
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const createImage = async (req, res) => {
    try {
        const { name, url, categoryId, tagIds } = req.body;

        if (typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ error: "name is required" });
        }
        if (url !== undefined && typeof url !== "string") {
            return res.status(400).json({ error: "url must be a string" });
        }
        const normalizedUrl = typeof url === "string" ? url.trim() : "";

        const categoryIdParsed = parseId(categoryId);
        if (categoryIdParsed === null) {
            return res.status(400).json({ error: "categoryId is required" });
        }

        const category = await prisma.category.findFirst({
            where: { id: categoryIdParsed, isDeleted: false },
        });
        if (!category) return res.status(404).json({ error: "Category not found" });

        let tagIdList = [];
        if (tagIds !== undefined) {
            if (!Array.isArray(tagIds)) return res.status(400).json({ error: "tagIds must be an array" });
            tagIdList = tagIds.map(parseId);
            if (tagIdList.some((t) => t === null)) return res.status(400).json({ error: "tagIds must be numbers" });
        }

        if (tagIdList.length > 0) {
            const tagsCount = await prisma.tag.count({
                where: { id: { in: tagIdList }, isDeleted: false },
            });
            if (tagsCount !== tagIdList.length) {
                return res.status(400).json({ error: "One or more tags not found" });
            }
        }

        const image = await prisma.image.create({
            data: {
                name: name.trim(),
                url: normalizedUrl,
                categoryId: categoryIdParsed,
            },
        });

        if (tagIdList.length > 0) {
            await prisma.imageTag.createMany({
                data: tagIdList.map((tagId) => ({ imageId: image.id, tagId })),
            });
        }
        await invalidateImageCache();

        return res.status(201).json({
            status: "success",
            message: "Image created successfully",
            data: { image },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const updateImage = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (id === null) return res.status(400).json({ error: "Invalid id" });

        const { name, url, categoryId, tagIds } = req.body;

        const image = await prisma.image.findFirst({
            where: { id, isDeleted: false },
        });
        if (!image) return res.status(404).json({ error: "Image not found" });

        const data = {};
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length === 0) {
                return res.status(400).json({ error: "name must be a non-empty string" });
            }
            data.name = name.trim();
        }
        if (url !== undefined) {
            if (typeof url !== "string" || url.trim().length === 0) {
                return res.status(400).json({ error: "url must be a non-empty string" });
            }
            data.url = url.trim();
        }
        if (categoryId !== undefined) {
            const categoryIdParsed = parseId(categoryId);
            if (categoryIdParsed === null) return res.status(400).json({ error: "categoryId must be a number" });

            const category = await prisma.category.findFirst({
                where: { id: categoryIdParsed, isDeleted: false },
            });
            if (!category) return res.status(404).json({ error: "Category not found" });

            data.categoryId = categoryIdParsed;
        }

        let tagIdList = null;
        if (tagIds !== undefined) {
            if (!Array.isArray(tagIds)) return res.status(400).json({ error: "tagIds must be an array" });
            const parsed = tagIds.map(parseId);
            if (parsed.some((t) => t === null)) return res.status(400).json({ error: "tagIds must be numbers" });
            tagIdList = Array.from(new Set(parsed));

            const tagsCount = await prisma.tag.count({
                where: { id: { in: tagIdList }, isDeleted: false },
            });
            if (tagsCount !== tagIdList.length) {
                return res.status(400).json({ error: "One or more tags not found" });
            }
        }

        const updatedImage = Object.keys(data).length
            ? await prisma.image.update({ where: { id }, data })
            : image;

        if (tagIdList !== null) {
            const existingRelations = await prisma.imageTag.findMany({
                where: { imageId: id },
                select: { id: true, tagId: true, isDeleted: true },
            });

            const existingByTagId = new Map(existingRelations.map((r) => [r.tagId, r]));

            await prisma.imageTag.updateMany({
                where: { imageId: id, tagId: { notIn: tagIdList } },
                data: { isDeleted: true },
            });

            const toUndelete = tagIdList.filter((t) => existingByTagId.get(t)?.isDeleted === true);
            if (toUndelete.length > 0) {
                await prisma.imageTag.updateMany({
                    where: { imageId: id, tagId: { in: toUndelete } },
                    data: { isDeleted: false },
                });
            }

            const toCreate = tagIdList.filter((t) => !existingByTagId.has(t));
            if (toCreate.length > 0) {
                await prisma.imageTag.createMany({
                    data: toCreate.map((tagId) => ({ imageId: id, tagId })),
                });
            }
        }
        await invalidateImageCache();

        return res.status(200).json({
            status: "success",
            message: "Image updated successfully",
            data: { image: updatedImage },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const deleteImage = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (id === null) return res.status(400).json({ error: "Invalid id" });

        const image = await prisma.image.findFirst({
            where: { id, isDeleted: false },
        });
        if (!image) return res.status(404).json({ error: "Image not found" });

        const deletedImage = await prisma.image.update({
            where: { id },
            data: { isDeleted: true },
        });
        await invalidateImageCache();

        return res.status(200).json({
            status: "success",
            message: "Image deleted successfully",
            data: { image: deletedImage },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const getImageByTags = async (req, res) => {
    try {
        const tagIdsFromQuery = parseIdList(req.query.id) || parseIdList(req.query.ids);
        const fallbackTagId = parseId(req.params.id);
        const tagIds = tagIdsFromQuery || (fallbackTagId !== null ? [fallbackTagId] : null);
        if (!tagIds) return res.status(400).json({ error: "Invalid tag id(s)" });

        const tags = await prisma.tag.findMany({
            where: { id: { in: tagIds }, isDeleted: false },
            select: { id: true, name: true },
        });
        if (tags.length === 0) return res.status(404).json({ error: "Tag not found" });

        const images = await prisma.image.findMany({
            where: {
                isDeleted: false,
                category: { is: { isDeleted: false } },
                imageTags: {
                    some: {
                        tagId: { in: tagIds },
                        isDeleted: false,
                        tag: { is: { isDeleted: false } },
                    },
                },
            },
            include: {
                category: true,
                imageTags: {
                    where: { isDeleted: false, tag: { is: { isDeleted: false } } },
                    include: { tag: true },
                },
            },
        });

        const data = images.map((img) => ({
            ...img,
            tags: mapImageTagsToTags(img.imageTags),
            imageTags: undefined,
        }));

        return res.status(200).json({
            status: "success",
            message: "Images by tag fetched successfully",
            data: { images: data },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const getImageByCategory = async (req, res) => {
    try {
        const categoryId = parseId(req.params.id);
        if (categoryId === null) return res.status(400).json({ error: "Invalid category id" });

        const category = await prisma.category.findFirst({
            where: { id: categoryId, isDeleted: false },
            select: { id: true, name: true },
        });

        if (!category) return res.status(404).json({ error: "Category not found" });

        const images = await prisma.image.findMany({
            where: {
                isDeleted: false,
                categoryId,
                category: { is: { isDeleted: false } },
            },
            include: {
                category: true,
                imageTags: {
                    where: { isDeleted: false, tag: { is: { isDeleted: false } } },
                    include: { tag: true },
                },
            },
        });

        const data = images.map((img) => ({
            ...img,
            tags: mapImageTagsToTags(img.imageTags),
            imageTags: undefined,
        }));

        return res.status(200).json({
            status: "success",
            message: "Images by category fetched successfully",
            data: {images: data },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const addImageTags = async (req, res) => {
    try {
        const imageId = parseId(req.params.id);
        if (imageId === null) return res.status(400).json({ error: "Invalid id" });

        const { tagIds } = req.body;
        if (!Array.isArray(tagIds) || tagIds.length === 0) {
            return res.status(400).json({ error: "tagIds must be a non-empty array" });
        }

        const parsed = tagIds.map(parseId);
        if (parsed.some((t) => t === null)) return res.status(400).json({ error: "tagIds must be numbers" });
        const tagIdList = Array.from(new Set(parsed));

        const image = await prisma.image.findFirst({
            where: { id: imageId, isDeleted: false },
            select: { id: true },
        });
        if (!image) return res.status(404).json({ error: "Image not found" });

        const tagsCount = await prisma.tag.count({
            where: { id: { in: tagIdList }, isDeleted: false },
        });
        if (tagsCount !== tagIdList.length) {
            return res.status(400).json({ error: "One or more tags not found" });
        }

        const existing = await prisma.imageTag.findMany({
            where: { imageId, tagId: { in: tagIdList } },
            select: { tagId: true, isDeleted: true },
        });
        const existingByTagId = new Map(existing.map((r) => [r.tagId, r]));

        const toUndelete = tagIdList.filter((t) => existingByTagId.get(t)?.isDeleted === true);
        if (toUndelete.length > 0) {
            await prisma.imageTag.updateMany({
                where: { imageId, tagId: { in: toUndelete } },
                data: { isDeleted: false },
            });
        }

        const toCreate = tagIdList.filter((t) => !existingByTagId.has(t));
        if (toCreate.length > 0) {
            await prisma.imageTag.createMany({
                data: toCreate.map((tagId) => ({ imageId, tagId })),
            });
        }
        await invalidateImageCache();

        return res.status(200).json({
            status: "success",
            message: "Image tags updated successfully",
            data: { imageId, tagIds: tagIdList },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const removeImageTag = async (req, res) => {
    try {
        const imageId = parseId(req.params.id);
        const tagId = parseId(req.params.tagId);
        if (imageId === null) return res.status(400).json({ error: "Invalid id" });
        if (tagId === null) return res.status(400).json({ error: "Invalid tagId" });

        const image = await prisma.image.findFirst({
            where: { id: imageId, isDeleted: false },
            select: { id: true },
        });
        if (!image) return res.status(404).json({ error: "Image not found" });

        const existing = await prisma.imageTag.findFirst({
            where: { imageId, tagId, isDeleted: false },
            select: { id: true },
        });

        if (!existing) return res.status(404).json({ error: "Tag relation not found" });

        await prisma.imageTag.updateMany({
            where: { imageId, tagId },
            data: { isDeleted: true },
        });
        await invalidateImageCache();

        return res.status(200).json({
            status: "success",
            message: "Image tag removed successfully",
            data: { imageId, tagId },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const uploadImage = async (req, res) => {
    try {
        const imageId = parseId(req.body.imageId);
        if (imageId === null) {
            return res.status(400).json({ error: "imageId is required" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "file is required" });
        }

        const image = await prisma.image.findFirst({
            where: { id: imageId, isDeleted: false },
            select: { id: true },
        });

        if (!image) {
            return res.status(404).json({ error: "Image not found" });
        }

        const uploaded = await uploadImageToS3({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            originalName: req.file.originalname,
            imageId,
        });

        await prisma.image.update({
            where: { id: imageId },
            data: { url: uploaded.url },
        });

        await invalidateImageCache();

        return res.status(200).json({
            status: "success",
            message: "Image uploaded successfully",
            data: { imageId, ...uploaded },
        });
    } catch (error) {
        console.error("Upload image error:", error.message);
        return res.status(500).json({ error: "Failed to upload image" });
    }

};

export {
    getImages,
    searchImages,
    getImageById,
    createImage,
    updateImage,
    deleteImage,
    getImageByTags,
    addImageTags,
    removeImageTag,
    uploadImage,
    getImageByCategory,
};
