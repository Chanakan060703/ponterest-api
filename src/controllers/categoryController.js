import { prisma } from "../config/db.js";
import { toHttpError } from "../utils/prismaErrors.js";

const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ error: "name is required" });
        }

        const existing = await prisma.category.findUnique({
            where: { name: name.trim() },
        });

        if (existing && existing.isDeleted === false) {
            return res.status(400).json({ error: "Category already exists" });
        }

        const category = existing
            ? await prisma.category.update({
                where: { id: existing.id },
                data: { isDeleted: false },
            })
            : await prisma.category.create({
                data: { name: name.trim() },
            });

        return res.status(201).json({
            status: "success",
            message: "Category created successfully",
            data: { category },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: { isDeleted: false },
        });

        return res.status(200).json({
            status: "success",
            message: "Categories fetched successfully",
            data: { categories },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({ error: "name is required" });
        }

        const categoryId = Number(id);
        if (!Number.isFinite(categoryId)) {
            return res.status(400).json({ error: "Invalid id" });
        }

        const category = await prisma.category.findFirst({
            where: { id: categoryId, isDeleted: false },
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        const nameTrimmed = name.trim();
        const existingByName = await prisma.category.findUnique({
            where: { name: nameTrimmed },
        });

        if (existingByName && existingByName.id !== categoryId && existingByName.isDeleted === false) {
            return res.status(400).json({ error: "Category already exists" });
        }

        const updatedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: { name: nameTrimmed },
        });

        return res.status(200).json({
            status: "success",
            message: "Category updated successfully",
            data: { category: updatedCategory },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const categoryId = Number(id);
        if (!Number.isFinite(categoryId)) {
            return res.status(400).json({ error: "Invalid id" });
        }

        const category = await prisma.category.findFirst({
            where: { id: categoryId, isDeleted: false },
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        const deletedCategory = await prisma.category.update({
            where: { id: categoryId },
            data: { isDeleted: true },
        });

        return res.status(200).json({
            status: "success",
            message: "Category deleted successfully",
            data: { category: deletedCategory },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};

export { createCategory, getCategories, updateCategory, deleteCategory };
