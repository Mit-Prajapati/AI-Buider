import jwt from "jsonwebtoken";
import User from "../models/User.js";


const SESSION_COOKIE_NAME = "session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function setSessionCookie(res, user) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured.");
    }

    const token = jwt.sign(
        { userId: user._id.toString() },
        secret,
        { expiresIn: "30d" },
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: SESSION_TTL_MS,
        path: "/",
    });
}

export async function ragister(req,res) {
    const { name, email, password } = req.body ?? {};

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || normalizedName.length > 100) {
        return res.status(400).json({ error: "Name must be between 1 and 100 characters." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ error: "Enter a valid email address." });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }

    try {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        const user = await User.create({
            name: normalizedName,
            email: normalizedEmail,
            password,
        });

        
            setSessionCookie(res, user);

        return res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        if (error?.name === "ValidationError") {
            const validationMessage = Object.values(error.errors ?? {})[0]?.message;
            return res.status(400).json({ error: validationMessage || "Invalid registration details." });
        }

        return res.status(500).json({ error: "Registration failed. Please try again." });
    }
}


export async function login(req,res) {
    const { email, password } = req.body ?? {};

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const user = await User.findOne({ email: normalizedEmail }).select("+password");
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        setSessionCookie(res,user);

        return res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch {
        return res.status(500).json({ error: "Login failed. Please try again." });
    }
}


export async function logout(req,res) {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge:0,
        path: "/",
    });

    return res.status(200).json({ message: "Logged out" });
}


export async function me(req,res) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (!token) {
        return res.status(401).json({ error: "Not authenticated." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(500).json({ error: "Session validation is unavailable." });
    }

    let payload;
    try {
        payload = jwt.verify(token, secret);
    } catch {
        return res.status(401).json({ error: "Invalid or expired session." });
    }

    if (!payload || typeof payload !== "object" || typeof payload.userId !== "string") {
        return res.status(401).json({ error: "Invalid session." });
    }

    try {
        const user = await User.findById(payload.userId).select("_id name email");
        if (!user) {
            return res.status(401).json({ error: "User session is no longer valid." });
        }

        return res.status(200).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        if (error?.name === "CastError") {
            return res.status(401).json({ error: "Invalid session." });
        }

        return res.status(500).json({ error: "Unable to load user data." });
    }
}
