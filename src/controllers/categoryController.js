import { prisma } from "../config/db.js";

const createCategory = async (req, res) => {
    const { name } = req.body;

    const category = await prisma.category.findUnique({
        where: { name: name },
    });

    if (!category) {
        return res.status(404).json({ error: "Category not found" });
    }
        

    const existingInCategory = await prisma.category.findUnique({
        where: { name: name },
    });

    if(existingInCategory){
        return res.status(400).json({error:"Category already exists"})
    }

    const newCategory = await prisma.category.create({
        data: {
            name,
        },
    });

    res.status(201).json({
        status: "success",
        message: "Category created successfully",
        data: {
            category: newCategory,
        },
    });
    
};

const getCategories = async (req, res) => {
    const categories = await prisma.category.findMany({
        where: { isDeleted: false },
    });

    res.status(200).json({
        status: "success",
        message: "Categories fetched successfully",
        data: {
            categories,
        },
    });
};

const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    const category = await prisma.category.findUnique({
        where: { id: Number(id) },
    });

    if (!category) {
        return res.status(404).json({ error: "Category not found" });
    }

    const existingInCategory = await prisma.category.findUnique({
        where: { name: name },
    });

    if(existingInCategory){
        return res.status(400).json({error:"Category already exists"})
    }

    const updatedCategory = await prisma.category.update({
        where: { id: Number(id) },
        data: {
            name,
        },
    });

    res.status(200).json({
        status: "success",
        message: "Category updated successfully",
        data: {
            category: updatedCategory,
        },
    });
};

const deleteCategory = async (req, res) => {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
        where: { id: Number(id) },
    });

    if (!category) {
        return res.status(404).json({ error: "Category not found" });
    }

    const deletedCategory = await prisma.category.update({
        where: { id: Number(id) },
        data: {
            isDeleted: true,
        },
    });

    res.status(200).json({
        status: "success",
        message: "Category deleted successfully",
        data: {
            category: deletedCategory,
        },
    });
};

export { createCategory, getCategories, updateCategory, deleteCategory };
