import { prisma } from "./src/config/db.js";
const count = await prisma.image.count();
console.log(`Current images in DB: ${count}`);
process.exit(0);
