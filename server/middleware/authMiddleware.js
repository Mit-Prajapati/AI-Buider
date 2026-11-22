import jwt from "jsonwebtoken";

export function authMiddleware(req,res,next){
    const token = req.cookies?.session;
    if (!token) {
        return res.status(401).json({ error: "Not authenticated." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: "Authentication is unavailable." });
    }

    try {
        const payload = jwt.verify(token, secret);
        if (!payload || typeof payload !== "object" || typeof payload.userId !== "string") {
            return res.status(401).json({ error: "Invalid session." });
        }

        req.auth = { userId: payload.userId };
        return next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired session." });
    }
}
