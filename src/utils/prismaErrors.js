export const toHttpError = (error) => {
    if (error && typeof error === "object") {
        const code = error.code;

        if (code === "P2002") {
            const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : null;
            return { status: 400, message: target ? `Duplicate value for: ${target}` : "Duplicate value" };
        }

        if (code === "P2025") {
            return { status: 404, message: "Not found" };
        }
    }

    return { status: 500, message: "Internal server error" };
};

