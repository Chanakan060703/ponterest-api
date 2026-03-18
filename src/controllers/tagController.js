import { prisma } from "../config/db.js";
import { toHttpError } from "../utils/prismaErrors.js";


const createTag = async (req, res) => {
    try {
        const { name } = req.body;
        if (typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ error: "name is required" });
        }

        const existing = await prisma.tag.findUnique({
            where: { name: name.trim() },
        });

        if (existing && existing.isDeleted === false) {
            return res.status(400).json({ error: "Tag already exists" });
        }

        const tag = existing
            ? await prisma.tag.update({
                where: { id: existing.id },
                data: { isDeleted: false },
            })
            : await prisma.tag.create({
                data: { name: name.trim() },
            });

        return res.status(201).json({
            status: "success",
            message: "Tag created successfully",
            data: { tag },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const getTags = async (req, res) => {
    try {
        const tags = await prisma.tag.findMany({
            where: { isDeleted: false },
        });

        return res.status(200).json({
            status: "success",
            message: "Tags fetched successfully",
            data: { tags },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const tagId = Number(id);
        if (!Number.isFinite(tagId)) {
            return res.status(400).json({ error: "Invalid id" });
        }

        if (typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ error: "name is required" });
        }

        const tag = await prisma.tag.findFirst({
            where: { id: tagId, isDeleted: false },
        });

        if (!tag) {
            return res.status(404).json({ error: "Tag not found" });
        }

        const nameTrimmed = name.trim();
        const existingByName = await prisma.tag.findUnique({
            where: { name: nameTrimmed },
        });

        if (existingByName && existingByName.id !== tagId && existingByName.isDeleted === false) {
            return res.status(400).json({ error: "Tag already exists" });
        }

        const updatedTag = await prisma.tag.update({
            where: { id: tagId },
            data: { name: nameTrimmed },
        });

        return res.status(200).json({
            status: "success",
            message: "Tag updated successfully",
            data: { tag: updatedTag },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const deleteTag = async (req, res) => {
    try {
        const { id } = req.params;
        const tagId = Number(id);
        if (!Number.isFinite(tagId)) {
            return res.status(400).json({ error: "Invalid id" });
        }

        const tag = await prisma.tag.findFirst({
            where: { id: tagId, isDeleted: false },
        });

        if (!tag) {
            return res.status(404).json({ error: "Tag not found" });
        }

        const deletedTag = await prisma.tag.update({
            where: { id: tagId },
            data: { isDeleted: true },
        });

        return res.status(200).json({
            status: "success",
            message: "Tag deleted successfully",
            data: { tag: deletedTag },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};

export { createTag, getTags, updateTag, deleteTag };

