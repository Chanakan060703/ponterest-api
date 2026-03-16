import express from "express";
import { createTag, deleteTag, getTags, updateTag } from "../controllers/tagController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getTags);

router.post("/", authMiddleware, createTag);
router.put("/:id", authMiddleware, updateTag);
router.delete("/:id", authMiddleware, deleteTag);

export default router;
