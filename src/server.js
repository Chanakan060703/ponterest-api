import express from 'express';
import {config} from 'dotenv';
import { connectDB, disconnectDB } from './config/db.js';

import userRoutes from './routers/userRoutes.js';
import authRoutes from './routers/authRoutes.js';
import categoryRoutes from './routers/categoryRoutes.js';
import tagRoutes from './routers/tagRoutes.js';
import imageRoutes from './routers/imageRoutes.js';

config();

await connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/categories", categoryRoutes);
app.use("/tags", tagRoutes);
app.use("/images", imageRoutes);


const port = 5001;
const server = app.listen(port, () =>{
    console.log(`Server is running on port ${port}`)
});

let isShuttingDown = false;
const shutdown = async (reason, exitCode) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    try {
        console.log(`Shutting down (${reason})`);
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
