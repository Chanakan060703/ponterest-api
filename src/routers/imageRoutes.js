import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createImage, deleteImage, getImageById, getImages, updateImage } from "../controllers/imageController.js";

const router = express.Router();

router.get("/", getImages);
router.get("/:id", getImageById);

router.post("/", authMiddleware, createImage);
router.put("/:id", authMiddleware, updateImage);
router.delete("/:id", authMiddleware, deleteImage);

export default router;
