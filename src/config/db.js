import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is required (check your .env)");
}

const pool = new Pool({ connectionString: databaseUrl });

const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log:
    process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"]
});

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Database connected");
    } catch (error) {
        console.error(`Database connection error ${error.message}`);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    await prisma.$disconnect();
    await pool.end();
    console.log("Database disconnected");
};

export { prisma, connectDB, disconnectDB };
