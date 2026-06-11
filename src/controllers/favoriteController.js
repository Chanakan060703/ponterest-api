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

const imageInclude = {
    category: true,
    imageTags: {
        where: { isDeleted: false, tag: { is: { isDeleted: false } } },
        include: { tag: true },
    },
};

const mapFavoriteToImage = (favorite) => ({
    ...favorite.image,
    favoritedAt: favorite.createdAt,
    tags: mapImageTagsToTags(favorite.image.imageTags),
    imageTags: undefined,
});

const ensureImageExists = async (imageId) => {
    return prisma.image.findFirst({
        where: {
            id: imageId,
            isDeleted: false,
            category: { is: { isDeleted: false } },
        },
        select: { id: true },
    });
};

const getFavorites = async (req, res) => {
    try {
        const favorites = await prisma.favoriteImage.findMany({
            where: {
                userId: req.user.id,
                image: {
                    isDeleted: false,
                    category: { is: { isDeleted: false } },
                },
            },
            orderBy: { createdAt: "desc" },
            include: {
                image: {
                    include: imageInclude,
                },
            },
        });

        return res.status(200).json({
            status: "success",
            message: "Favorites fetched successfully",
            data: { images: favorites.map(mapFavoriteToImage) },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};

const addFavorite = async (req, res) => {
    try {
        const imageId = parseId(req.params.imageId);
        if (imageId === null) return res.status(400).json({ error: "Invalid imageId" });

        const image = await ensureImageExists(imageId);
        if (!image) return res.status(404).json({ error: "Image not found" });

        const favorite = await prisma.favoriteImage.upsert({
            where: {
                userId_imageId: {
                    userId: req.user.id,
                    imageId,
                },
            },
            update: {},
            create: {
                userId: req.user.id,
                imageId,
            },
            include: {
                image: {
                    include: imageInclude,
                },
            },
        });

        return res.status(200).json({
            status: "success",
            message: "Favorite saved successfully",
            data: { image: mapFavoriteToImage(favorite) },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};

const removeFavorite = async (req, res) => {
    try {
        const imageId = parseId(req.params.imageId);
        if (imageId === null) return res.status(400).json({ error: "Invalid imageId" });

        await prisma.favoriteImage.deleteMany({
            where: {
                userId: req.user.id,
                imageId,
            },
        });

        return res.status(200).json({
            status: "success",
            message: "Favorite removed successfully",
            data: { imageId },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};

export { addFavorite, getFavorites, removeFavorite };
