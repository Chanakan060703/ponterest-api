import express from 'express';
import {config} from 'dotenv';
import cookieParser from "cookie-parser";
import { connectDB, disconnectDB } from './config/db.js';
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

import userRoutes from './routers/userRoutes.js';
import authRoutes from './routers/authRoutes.js';
import categoryRoutes from './routers/categoryRoutes.js';
import tagRoutes from './routers/tagRoutes.js';
import imageRoutes from './routers/imageRoutes.js';

config();

await connectDB();
await connectRedis();

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin === 'http://localhost:3000' || origin === 'https://ponterest-frontend-git-dev-chanakan060703s-projects.vercel.app') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
    }
    next();
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/categories", categoryRoutes);
app.use("/tags", tagRoutes);
app.use("/images", imageRoutes);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5001;
const host = process.env.HOST || "localhost";
const server = app.listen(port,host, () =>{
    console.log(`Server is running on port ${port}`);
});

let isShuttingDown = false;
const shutdown = async (reason, exitCode) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    try {
        console.log(`Shutting down (${reason})`);
        await disconnectRedis();
        await disconnectDB();
    } catch (error) {
        console.error("Error during shutdown:", error);
    } finally {
        server.close(() => process.exit(exitCode));
    }
};

process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:",err);
    shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:",err);
    shutdown("uncaughtException", 1);
});

process.on("SIGTERM", () => {
    console.log("SIGTERM received");
    shutdown("SIGTERM", 0);
});

process.on("SIGINT", () => {
    console.log("SIGINT received");
    shutdown("SIGINT", 0);
});
