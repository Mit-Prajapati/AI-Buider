import { Router } from "express";
import { login, logout, me, ragister } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const authRouter = Router();

authRouter.post("/ragister",ragister)
authRouter.post("/login",login)
authRouter.post("/logout",logout)
authRouter.get("/me",authMiddleware,me)


export default authRouter;
