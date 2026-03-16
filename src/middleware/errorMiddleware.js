import { Prisma } from "@prisma/client";

const notFound = (req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    next(error);
};

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const status = err.status || "error";

    if(err instanceof Prisma.PrismaClientValidationError){
        if(err.code === "P2002"){
            const field = err.meta?.target?.[0] || "field";
            err.statusCode = 400;
            err.message = `${field} already exists`;
        }

        if(err.code === "P2025"){
            err.statusCode = 404;
            err.message = "Record not found";
        }

        if(err instanceof Prisma.PrismaClientKnownRequestError){
            if(err.code === "P2003"){
                err.statusCode = 400;
                err.message = "Invalid reference: related record not found";
            }
        }
    }

    if(err instanceof Error){
        err.statusCode = err.statusCode || 500;
        err.status = err.status || "error";
    }

    res.status(statusCode).json({
        status,
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : {},
    });

}
export { notFound, errorHandler };
