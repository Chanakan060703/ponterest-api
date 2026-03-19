import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadImageMiddleware } from "../middleware/uploadImageMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
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
import {
    addImageTagsSchema,
    createImageSchema,
    imageByTagsQuerySchema,
    imageIdParamSchema,
    imageListQuerySchema,
    imageSearchQuerySchema,
    imageTagParamSchema,
    updateImageSchema,
    uploadImageBodySchema,
} from "../validators/imageValidators.js";

const router = express.Router();

router.get("/", validateRequest(imageListQuerySchema, "query"), getImages);
router.get("/search", validateRequest(imageSearchQuerySchema, "query"), searchImages);
router.get("/tags", validateRequest(imageByTagsQuerySchema, "query"), getImageByTags);
router.get("/categories/:id/images", validateRequest(imageIdParamSchema, "params"), getImageByCategory);
router.get("/:id", validateRequest(imageIdParamSchema, "params"), getImageById);

router.post("/", authMiddleware, validateRequest(createImageSchema), createImage);
router.put("/upload-image", authMiddleware, uploadImageMiddleware, validateRequest(uploadImageBodySchema), uploadImage);
router.put("/:id", authMiddleware, validateRequest(imageIdParamSchema, "params"), validateRequest(updateImageSchema), updateImage);
router.delete("/:id", authMiddleware, validateRequest(imageIdParamSchema, "params"), deleteImage);

router.post("/:id/tags", authMiddleware, validateRequest(imageIdParamSchema, "params"), validateRequest(addImageTagsSchema), addImageTags);
router.delete("/:id/tags/:tagId", authMiddleware, validateRequest(imageTagParamSchema, "params"), removeImageTag);

export default router;
