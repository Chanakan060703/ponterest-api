import { z } from "zod";

const favoriteImageParamSchema = z.object({
    imageId: z.coerce.number().int().positive("Invalid imageId"),
});

export { favoriteImageParamSchema };
