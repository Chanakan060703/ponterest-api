import jwt from "jsonwebtoken";

const getJwtCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
});

export const generateToken = (userId, res) => {
    const payload = { id: userId };
    const token = jwt.sign(payload,process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    res.cookie("jwt",token, getJwtCookieOptions());
    return token;
};

export { getJwtCookieOptions };
