export const validateRequest = (schema, source = "body") => {
    return (req, res, next) => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            const flatErrors = result.error.issues.map((issue) => issue.message);
            return res.status(400).json({ error: flatErrors.join(", ") });
        }

        next();
    };
};
