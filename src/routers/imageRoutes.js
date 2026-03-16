import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
    addImageTags,
    createImage,
    deleteImage,
    getImageById,
    getImages,
    getImageTags,
    removeImageTag,
    updateImage,
} from "../controllers/imageController.js";

const router = express.Router();

router.get("/", getImages);
router.get("/:id/tags", getImageTags);
router.get("/:id", getImageById);

router.post("/", authMiddleware, createImage);
router.put("/:id", authMiddleware, updateImage);
router.delete("/:id", authMiddleware, deleteImage);

router.post("/:id/tags", authMiddleware, addImageTags);
router.delete("/:id/tags/:tagId", authMiddleware, removeImageTag);

export default router;
