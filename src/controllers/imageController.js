import { prisma } from "../config/db.js";
import { toHttpError } from "../utils/prismaErrors.js";

const parseId = (value) => {
    const id = Number(value);
    return Number.isFinite(id) ? id : null;
};

const mapImageTagsToTags = (imageTags) =>
    imageTags
        .filter((it) => it.isDeleted === false && it.tag?.isDeleted === false)
        .map((it) => it.tag);

const getImages = async (req, res) => {
    try {
        const categoryId = req.query.categoryId ? parseId(req.query.categoryId) : null;
        const tagId = req.query.tagId ? parseId(req.query.tagId) : null;

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
                              tag: { isDeleted: false },
                          },
                      },
                  }
                : {}),
            category: { isDeleted: false },
        };

        const images = await prisma.image.findMany({
            where,
            include: {
                category: true,
                imageTags: {
                    where: { isDeleted: false, tag: { isDeleted: false } },
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
            message: "Images fetched successfully",
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

        const image = await prisma.image.findFirst({
            where: { id, isDeleted: false, category: { isDeleted: false } },
            include: {
                category: true,
                imageTags: {
                    where: { isDeleted: false, tag: { isDeleted: false } },
                    include: { tag: true },
                },
            },
        });

        if (!image) return res.status(404).json({ error: "Image not found" });

        return res.status(200).json({
            status: "success",
            message: "Image fetched successfully",
            data: {
                image: {
                    ...image,
                    tags: mapImageTagsToTags(image.imageTags),
                    imageTags: undefined,
                },
            },
        });
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
        if (typeof url !== "string" || url.trim().length === 0) {
            return res.status(400).json({ error: "url is required" });
        }

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
                url: url.trim(),
                categoryId: categoryIdParsed,
            },
        });

        if (tagIdList.length > 0) {
            await prisma.imageTag.createMany({
                data: tagIdList.map((tagId) => ({ imageId: image.id, tagId })),
            });
        }

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

const getImageTags = async (req, res) => {
    try {
        const id = parseId(req.params.id);
        if (id === null) return res.status(400).json({ error: "Invalid id" });

        const image = await prisma.image.findFirst({
            where: { id, isDeleted: false },
            include: {
                imageTags: {
                    where: { isDeleted: false, tag: { isDeleted: false } },
                    include: { tag: true },
                },
            },
        });

        if (!image) return res.status(404).json({ error: "Image not found" });

        return res.status(200).json({
            status: "success",
            message: "Image tags fetched successfully",
            data: { tags: mapImageTagsToTags(image.imageTags) },
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

export {
    getImages,
    getImageById,
    createImage,
    updateImage,
    deleteImage,
    getImageTags,
    addImageTags,
    removeImageTag,
};
