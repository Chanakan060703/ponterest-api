export const validateRequest = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const formatted = result.error.format();

            const flatErrors = Object.values(formatted)
                .flat()
                .filter(Boolean)
                .map((error) => error._errors)
                .flat();

            return res.status(400).json({MessageChannel:flatErrors.join(", "),});
        }
        next();
    };
};