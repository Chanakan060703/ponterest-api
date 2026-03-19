import multer from "multer";
import path from "node:path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const MAX_FILE_SIZE_BYTES = Number(process.env.IMAGE_MAX_FILE_SIZE_BYTES) || 5 * 1024 * 1024;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname || "").toLowerCase();
        const isAllowedExtension = ALLOWED_EXTENSIONS.has(extension);
        const isAllowedMime = typeof file.mimetype === "string" && file.mimetype.startsWith("image/");
        const isAllowedOctetStream = file.mimetype === "application/octet-stream" && isAllowedExtension;

        if (!isAllowedMime && !isAllowedOctetStream && !isAllowedExtension) {
            return cb(new Error("Only image files are allowed"));
        }
        cb(null, true);
    },
});

const uploadImageMiddleware = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (!error) return next();

        if (error instanceof multer.MulterError) {
            if (error.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ error: "Image file is too large" });
            }
            return res.status(400).json({ error: error.message });
        }

        return res.status(400).json({ error: error.message || "Invalid image upload" });
    });
};

export { uploadImageMiddleware };
