import { Prisma } from "@prisma/client";

const notFound = (req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    next(error);
};

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        statusCode = 400;
        message = "Invalid JSON payload";
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            const field = err.meta?.target?.[0] || "field";
            statusCode = 400;
            message = `${field} already exists`;
        } else if (err.code === "P2003") {
            statusCode = 400;
            message = "Invalid reference: related record not found";
        } else if (err.code === "P2025") {
            statusCode = 404;
            message = "Record not found";
        }
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        statusCode = 400;
        message = "Bad request";
    }

    res.status(statusCode).json({
        error: message,
    });
};

export { notFound, errorHandler };
