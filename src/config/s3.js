import "dotenv/config";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const {
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    AWS_S3_BUCKET,
} = process.env;

const hasS3Config = Boolean(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_REGION && AWS_S3_BUCKET);

const s3Client = hasS3Config
    ? new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
    })
    : null;

const buildObjectKey = (originalName, imageId) => {
    const extension = path.extname(originalName || "").toLowerCase();
    if (imageId !== undefined && imageId !== null) {
        return `images/${imageId}/${Date.now()}-${randomUUID()}${extension}`;
    }
    return `images/${Date.now()}-${randomUUID()}${extension}`;
};

const uploadImageToS3 = async ({ buffer, mimeType, originalName, imageId }) => {
    if (!s3Client || !AWS_S3_BUCKET || !AWS_REGION) {
        throw new Error("S3 is not configured");
    }

    const key = buildObjectKey(originalName, imageId);
    const command = new PutObjectCommand({
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
    });

    await s3Client.send(command);

    return {
        key,
        url: `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`,
    };
};

export { uploadImageToS3 };
