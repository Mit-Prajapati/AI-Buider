import { Router } from "express";
import { createProject, deleteProjects, getProject, getPublicProjects, listProjects, publishProjects, updateProjectFiles } from "../controllers/ProjectController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { chat } from "../controllers/chatController.js";


const projectRouter   =     Router();

//Public Routes 

projectRouter.get("public/:id",getPublicProjects)



//Protect all Following routes

projectRouter.use(authMiddleware)

projectRouter.post("/",createProject)

projectRouter.post("/:id/chat", chat)

projectRouter.get("/",listProjects)

projectRouter.get("/:id",getProject)

projectRouter.delete("/:id",deleteProjects)


projectRouter.put("/:id/files",updateProjectFiles)

projectRouter.post("/:id/publish",publishProjects)

// Chat
projectRouter.post("/:id/chat",chat)


export  default projectRouter;
