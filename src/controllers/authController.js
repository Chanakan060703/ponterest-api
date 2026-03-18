import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";
import { toHttpError } from "../utils/prismaErrors.js";

const register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof phone !== "string" ||
            typeof password !== "string" ||
            name.trim().length === 0 ||
            email.trim().length === 0 ||
            phone.trim().length === 0 ||
            password.length === 0
        ) {
            return res.status(400).json({ error: "name, email, phone, password are required" });
        }

        const userExists = await prisma.user.findUnique({
            where: { email: email.trim() },
        });

        if (userExists) {
            return res.status(400).json({ error: "User already exists with this email" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                password: hashedPassword,
            },
        });

        const token = generateToken(user.id, res);

        return res.status(201).json({
            status: "success",
            message: "User registered successfully",
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                },
                token,
            },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (typeof email !== "string" || typeof password !== "string" || email.trim().length === 0) {
            return res.status(400).json({ error: "email and password are required" });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.trim() },
        });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = generateToken(user.id, res);

        return res.status(201).json({
            status: "success",
            message: "User logged in successfully",
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                },
                token,
            },
        });
    } catch (error) {
        const httpError = toHttpError(error);
        return res.status(httpError.status).json({ error: httpError.message });
    }
};


const logout = async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({
        status: "success",
        message: "Logged out successfully" ,
    });
};

export { register, login, logout }
