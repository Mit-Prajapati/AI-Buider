import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectToDatabase } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import projectRouter from "./routes/projectsRoutes.js";


const app = express();

connectToDatabase()

app.use(cors({origin:process.env.ORIGINS.split(","),credentials:true}))
app.use(cookieParser())

app.use(express.json())
app.use("/api/projects",projectRouter)



app.get("/",(req,res)=>res.send("Server is live"))

app.use('/api/auth',authRouter)

// Send unknown routes through the same error response as other failures.
app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
});

// Centralized Error Handler
app.use((err, req, res, next) => {
    const statusCode = Number.isInteger(err.statusCode) && err.statusCode >= 400
        ? err.statusCode
        : Number.isInteger(err.status) && err.status >= 400
            ? err.status
            : 500;

    if (res.headersSent) {
        return next(err);
    }

    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 && process.env.NODE_ENV === "production"
            ? "Internal Server Error"
            : err.message || "Internal Server Error",
    });
});

const port = process.env.PORT || 3000;
app.listen(port,()=>{
    console.log(`Server Is Running at http://localhost:${port}`)
})
