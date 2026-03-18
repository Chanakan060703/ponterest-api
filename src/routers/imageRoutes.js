import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadImageMiddleware } from "../middleware/uploadImageMiddleware.js";
import {
    addImageTags,
    createImage,
    deleteImage,
    getImageById,
    getImages,
    searchImages,
    getImageByTags,
    removeImageTag,
    uploadImage,
    updateImage,
    getImageByCategory,
} from "../controllers/imageController.js";

const router = express.Router();

router.get("/", getImages);
router.get("/search", searchImages);
router.get("/tags", getImageByTags);
router.get("/categories/:id/images", getImageByCategory);
router.get("/:id", getImageById);

router.post("/", authMiddleware, createImage);
router.put("/upload-image", authMiddleware, uploadImageMiddleware, uploadImage);
router.put("/:id", authMiddleware, updateImage);
router.delete("/:id", authMiddleware, deleteImage);

router.post("/:id/tags", authMiddleware, addImageTags);
router.delete("/:id/tags/:tagId", authMiddleware, removeImageTag);

export default router;
