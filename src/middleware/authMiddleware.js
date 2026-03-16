import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

export const authMiddleware = async (req, res, next) => {
    let token;

    if(
        req.headers.authorization && 
        req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1];
    }else if (req.cookies?.jwt){
        token = req.cookies.jwt;
    }

    if(!token){
        return res.status(401).json({error:"Not authorized, no token provided"});
    }

    try {
        const decodedToken = jwt.verify(token,process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: {id: decodedToken.id},
        });

        if(!user){
            return res.status(401).json({error:"User no longer exists"});
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        res.status(401).json({error:"Not authorized, token failed"});
    }
};
