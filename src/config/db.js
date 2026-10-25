import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is required (check your .env)");
}

// ตั้งค่า Pool ให้รองรับการเชื่อมต่อระยะไกลและป้องกัน Timeout
const pool = new Pool({ 
    connectionString: databaseUrl,
    // เปิดใช้งาน SSL สำหรับ Render และข้ามการตรวจสอบ Certificate เข้มงวดเกินไปจากเครื่อง local
    ssl: databaseUrl.includes("render.com") ? { rejectUnauthorized: false } : undefined,
    idleTimeoutMillis: 30000,          // ระยะเวลาปล่อย Connection ที่ไม่ได้ใช้งานให้อยู่ได้นานขึ้น (30 วิ)
    connectionTimeoutMillis: 10000,    // เวลารอเชื่อมต่อสูงสุดก่อนจะ Timeout (10 วิ)
    max: 10                            // จำกัดจำนวน Connection ใน Pool ไม่ให้แย่งกันเยอะเกินไป
});

const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"]
});

const connectDB = async () => {
    try {
        await prisma.$connect();
        console.log("Database connected");
    } catch (error) {
        console.error(`Database connection error: ${error.message}`);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try {
        await prisma.$disconnect();
        await pool.end();
        console.log("Database disconnected");
    } catch (error) {
        console.error(`Database disconnection error: ${error.message}`);
    }
};

export { prisma, connectDB, disconnectDB };