import express from "express";
import { createTag, deleteTag, getTags, updateTag } from "../controllers/tagController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createTagSchema, tagIdParamSchema, updateTagSchema } from "../validators/tagValidators.js";

const router = express.Router();

router.get("/", getTags);

router.post("/", authMiddleware, validateRequest(createTagSchema), createTag);
router.put("/:id", authMiddleware, validateRequest(tagIdParamSchema, "params"), validateRequest(updateTagSchema), updateTag);
router.delete("/:id", authMiddleware, validateRequest(tagIdParamSchema, "params"), deleteTag);

export default router;
