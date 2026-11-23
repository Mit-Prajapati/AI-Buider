
import crypto from "crypto";
import Project from "../models/Project.js";
import { generateProject } from "../services/ai.js";



        function hashContent(content){
            return crypto.createHash("md5").update(content).digest("hex").slice(0,12)
        }



// POST /api/projects 
// Create a  new project FROM an ai prompt 

export async function createProject(req,res) {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const ownerId = req.auth?.userId;

    if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated." });
    }

    if (!prompt) {
        return res.status(400).json({ error: "A project prompt is required." });
    }

    if (prompt.length > 10_000) {
        return res.status(400).json({ error: "Project prompt must be 10,000 characters or fewer." });
    }

    const projectName = prompt.length > 28 ? `${prompt.slice(0, 28)}...` : prompt;

    try {
        const project = await Project.create({
            owner: ownerId,
            name: projectName,
            description: prompt,
            version: 1,
            status: "generating",
            files: {},
            messages: [{ role: "user", content: prompt },{role:"assistant",content:'Planing project structure'}],
            filesPlanned:[],
            filesGenerated:[],
            currentFile:null,
            error:null,
        });

        void runBackgroundGeneration(project._id, prompt).catch(async () => {
            try {
                await Project.findByIdAndUpdate(project._id, {
                    $set: { status: "failed", error: "Project generation failed." },
                });
            } catch {
                // Keep background errors from affecting the already-sent response.
            }
        });

        return res.status(201).json({
            _id: project._id,
            name: project.name,
            description: project.description,
            version: project.version,
            status: project.status,
            published: project.published,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            messages: project.messages,
            files: project.files,
            filesPlanned:project.filesPlanned,
            filesGenerated:project.filesGenerated,
            currentFile:project.currentFile,
            error:project.error,
        });
    } catch (error) {
        if (error?.name === "ValidationError" || error?.name === "CastError") {
            return res.status(400).json({ error: error.message || "Invalid project details." });
        }

        return res.status(500).json({ error: "Failed to create project. Please try again." });
    }
}

// Background worker to progressive genarate files and update  database in real time 

 async function runBackgroundGeneration(projectId,prompt) {
    let writes = Promise.resolve();
    let plannedFiles = [];
    const normalizePath = (path) => path.startsWith("/") ? path : `/${path}`;

    // The AI service runs callbacks concurrently. Serialize document saves to
    // preserve every completed file when loading and saving fresh documents.
    const updateProject = (update) => {
        const write = writes.then(async () => {
            const project = await Project.findById(projectId);
            if (!project) throw new Error("Project no longer exists.");
            update(project);
            await project.save();
        });
        writes = write.catch(() => {});
        return write;
    };

    try {
        console.log(`[Background AI] Starting generation for project ${projectId}`);

        const result = await generateProject(prompt, {
            onPlan: async (plan) => {
                plannedFiles = plan.files.map(({ path, description }) => ({
                    path: normalizePath(path),
                    description,
                }));
                const fileList = plannedFiles
                    .map((file) => `- \`${file.path}\`: ${file.description}`)
                    .join("\n");

                console.log(`[Background AI] Planned ${plannedFiles.length} files for project ${projectId}`);
                await updateProject((project) => {
                    project.name = (plan.projectName || "Generated Project").trim().slice(0, 120) || "Generated Project";
                    project.status = "generating";
                    project.filesplaned = plannedFiles;
                    project.filesGenerated = [];
                    project.currentFile = null;
                    project.error = null;
                    project.messages.push({
                        role: "assistant",
                        content: `Project plan created. Generating ${plannedFiles.length} files:\n${fileList}`,
                        timestamp: new Date(),
                    });
                });
            },
            onFileStart: async (path) => {
                console.log(`[Background AI] Starting file ${path} for project ${projectId}`);
                await updateProject((project) => {
                    project.currentFile = normalizePath(path);
                });
            },
            onFileComplete: async (path, code) => {
                console.log(`[Background AI] Finished file ${path} for project ${projectId}`);
                await updateProject((project) => {
                    const normalizedPath = normalizePath(path);
                    project.files = project.files || {};
                    project.files[normalizedPath] = { content: code, hash: hashContent(code) };
                    project.filesGenerated = [...new Set([...(project.filesGenerated || []), normalizedPath])];
                    project.markModified("files");
                });
            },
        });

        // The service may return partial results after exhausting retries.
        const generatedFiles = Object.fromEntries(
            Object.entries(result.files).map(([path, code]) => [normalizePath(path), code]),
        );
        if (!generatedFiles["/App.js"]?.trim() ||
            plannedFiles.some(({ path }) => !generatedFiles[path]?.trim())) {
            throw new Error("Some project files could not be generated. Please try again.");
        }

        await updateProject((project) => {
            project.files = Object.fromEntries(Object.entries(generatedFiles).map(
                ([path, code]) => [path, { content: code, hash: hashContent(code) }],
            ));
            project.markModified("files");
            project.filesGenerated = Object.keys(generatedFiles);
            project.status = "completed";
            project.version = 1;
            project.currentFile = null;
            project.error = null;
            if (result.description) project.description = result.description;
            project.messages.push({
                role: "assistant",
                content: "Website generation complete! You can view and edit the files.",
                timestamp: new Date(),
            });
        });
        console.log(`[Background AI] Successfully generated project ${projectId}`);
    } catch (error) {
        await writes;
        console.error(`[Background AI] Generation failed for project ${projectId}:`, error.message);
        const project = await Project.findById(projectId);
        if (!project) return;
        project.status = "failed";
        project.currentFile = null;
        project.error = error.message || "Project generation failed.";
        project.messages.push({
            role: "assistant",
            content: `Generation failed: ${project.error}`,
            timestamp: new Date(),
        });
        await project.save();
    }
 }



// GET /api / projctss 
// List all projects onwed by  user (summery only, no file contents).

export async function listProjects(req,res) {
    const ownerId = req.auth?.userId;
    if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated." });
    }

    try {
        const projects = await Project.find({ owner: ownerId })
            .select("_id name description version createdAt updatedAt")
            .sort({ updatedAt: -1 })
            .lean();

        return res.status(200).json(projects);
    } catch {
        return res.status(500).json({ error: "Failed to load projects. Please try again." });
    }
}


// GET /api / projctss /:id
// get full project detail
export async function getProject(req,res) {
    const ownerId = req.auth?.userId;
    if (!ownerId) {
        return res.status(401).json({ error: "Not authenticated." });
    }

    const projectId = req.params?.id;
    if (!projectId) {
        return res.status(400).json({ error: "Project ID is required." });
    }

    try {
        const project = await Project.findOne({ _id: projectId, owner: ownerId })
            .select("-owner -__v")
            .lean();

        if (!project) {
            return res.status(404).json({ error: "Project not found." });
        }

        const filesObj = {};
        const storedFiles =
            project.files && typeof project.files === "object" && !Array.isArray(project.files)
                ? project.files
                : {};

        for (const [path, entry] of Object.entries(storedFiles)) {
            if (typeof entry === "string") {
                filesObj[path] = entry;
            } else if (entry && typeof entry.content === "string") {
                filesObj[path] = entry.content;
            }
        }

        return res.status(200).json({
            _id: project._id,
            name: project.name,
            description: project.description,
            version: project.version,
            status: project.status,
            published: project.published,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            messages: project.messages,
            files: filesObj,
            filesPlanned: project.filesplaned || [],
            filesGenerated: project.filesGenerated || [],
            currentFile: project.currentFile ?? null,
            error: project.error ?? null,
        });
    } catch (error) {
        if (error?.name === "CastError") {
            return res.status(404).json({ error: "Project not found." });
        }

        return res.status(500).json({ error: "Failed to load project. Please try again." });
    }
}


// DELETE /api / projctss / :id 
// DELETE a Project 
export async function deleteProjects(req,res) {
    const ownerId = req.auth?.userId;
    if (!ownerId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const projectId = req.params?.id;
    if (!projectId) {
        return res.status(400).json({ error: "Project ID is required." });
    }

    try {
        const deletedProject = await Project.findOneAndDelete({
            _id: projectId,
            owner: ownerId,
        });

        if (!deletedProject) {
            return res.status(404).json({ error: "Project not found." });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        if (error?.name === "CastError") {
            return res.status(404).json({ error: "Project not found." });
        }

        return res.status(500).json({ error: "Failed to delete project. Please try again." });
    }
}


// PUT /api / projctss / :id/files
// Update  projct files (manual edits )

export async function updateProjectFiles(req,res) {
    const ownerId = req.auth?.userId;
    if (!ownerId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const projectId = req.params?.id;
    if (!projectId) {
        return res.status(400).json({ error: "Project ID is required." });
    }

    const files = req.body?.files;
    if (!files || typeof files !== "object" || Array.isArray(files)) {
        return res.status(400).json({ error: "Files must be provided as an object." });
    }

    if (Object.values(files).some((content) => typeof content !== "string")) {
        return res.status(400).json({ error: "Each project file must contain text content." });
    }

    try {
        const project = await Project.findOne({ _id: projectId, owner: ownerId });
        if (!project) {
            return res.status(404).json({ error: "Project not found." });
        }

        /////////////////////    New Feature ADDEED CHECK IT /........

        const existingFiles =
            project.files && typeof project.files === "object" && !Array.isArray(project.files)
                ? project.files
                : {};
        const newFiles = {};
        for (const [path, content] of Object.entries(files)) {
            const hash = hashContent(content);
            const existingEntry = existingFiles[path];

            if (existingEntry?.hash === hash && existingEntry.content === content) {
                newFiles[path] = existingEntry;
            } else {
                newFiles[path] = { content, hash };
            }
        }

        project.files = newFiles;
        project.markModified("files");
        await project.save();

        const filesObj = {};
        for (const [path, entry] of Object.entries(project.files)) {
            if (entry && typeof entry.content === "string") {
                filesObj[path] = entry.content;
            }
        }

        return res.status(200).json({
            success: true,
            _id: project._id,
            name: project.name,
            description: project.description,
            version: project.version,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            messages: project.messages,
            files: filesObj,
        });

        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    } catch (error) {
        if (error?.name === "CastError") {
            return res.status(404).json({ error: "Project not found." });
        }

        return res.status(500).json({ error: "Failed to save project files. Please try again." });
    }
}









// POST/api / projctss /:id/publish 
// Mark a project as publically published
export async function publishProjects(req,res) {
    const ownerId = req.auth?.userId;
    if (!ownerId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const projectId = req.params?.id;
    if (!projectId) {
        return res.status(400).json({ error: "Project ID is required." });
    }

    try {
        const project = await Project.findOneAndUpdate(
            { _id: projectId, owner: ownerId },
            { $set: { published: true } },
            { new: true, runValidators: true },
        );

        if (!project) {
            return res.status(404).json({ error: "Project not found." });
        }

        return res.status(200).json({ published: true });
    } catch (error) {
        if (error?.name === "CastError") {
            return res.status(404).json({ error: "Project not found." });
        }

        return res.status(500).json({ error: "Failed to publish project. Please try again." });
    }
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// GET /api / projctes/publish/:id
// Get a publically published project details (without auth).

export async function getPublicProjects(req,res) {
    const projectId = req.params?.id;
    if (!projectId) {
        return res.status(400).json({ error: "Project ID is required." });
    }

    try {
        const project = await Project.findOne({ _id: projectId, published: true })
            .select("_id name version published files")
            .lean();

        if (!project) {
            return res.status(404).json({ error: "Website unavailable or not published yet." });
        }

        const filesObj = {};
        const storedFiles =
            project.files && typeof project.files === "object" && !Array.isArray(project.files)
                ? project.files
                : {};

        for (const [path, entry] of Object.entries(storedFiles)) {
            if (typeof entry === "string") {
                filesObj[path] = entry;
            } else if (entry && typeof entry.content === "string") {
                filesObj[path] = entry.content;
            }
        }

        return res.status(200).json({
            _id: project._id,
            name: project.name,
            description:project.description,
            version: project.version,
            published: project.published,
            files: filesObj,
        });
    } catch (error) {
        if (error?.name === "CastError") {
            return res.status(404).json({ error: "Website unavailable or not published yet." });
        }

        return res.status(500).json({ error: "Failed to load published project. Please try again." });
    }
}
