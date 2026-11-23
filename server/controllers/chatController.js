
// POST /api / projects/:id/chat
// send a riviseion prompt and return updated  version 

import Project from "../models/Project.js";
import { reviseProject } from "../services/ai.js";
import { applyOperations, hashContent } from "../services/diff.js";




export function buildManifest(files){
    const manifest = [];
    for (const [path,entry] of Object.entries(files)) {

        manifest.push({path,hash:entry.hash,size:Buffer.byteLength(entry.content, "utf8")})
        
    }

    return manifest;


}

const activeRevisions = new Set();

export async function chat(req,res) {
    const prompt = typeof req.body?.prompt === "string" ? req.body.prompt.trim() : "";
    const ownerId = req.auth?.userId;
    const projectId = req.params?.id;

    if (!ownerId) return res.status(401).json({ error: "Not authenticated." });
    if (!prompt) return res.status(400).json({ error: "Prompt is required." });
    if (prompt.length > 10_000) {
        return res.status(400).json({ error: "Prompt must be 10,000 characters or fewer." });
    }
    if (!projectId) return res.status(400).json({ error: "Project ID is required." });
    if (activeRevisions.has(projectId)) {
        return res.status(409).json({ error: "This project is already being revised." });
    }

    activeRevisions.add(projectId);
    let revisionStarted = false;
    try {
        let project = await Project.findOne({ _id: projectId, owner: ownerId });
        if (!project) return res.status(404).json({ error: "Project not found." });
        if (["pending", "generating", "updating", "revising"].includes(project.status)) {
            return res.status(409).json({ error: "Please wait for the current project task to finish." });
        }

        // Support both legacy text entries and the current content/hash format.
        const currentFiles = Object.fromEntries(Object.entries(project.files || {}).map(([path, entry]) => {
            const content = typeof entry === "string" ? entry : entry.content;
            return [path, { content, hash: hashContent(content) }];
        }));
        if (!Object.keys(currentFiles).length) {
            return res.status(400).json({ error: "Generate project files before requesting a revision." });
        }
        const originalFiles = JSON.stringify(project.files);

        // Set status to revising and save the user prompt immediately.
        project.status = "revising";
        project.error = null;
        project.errors = [];
        project.currentFile = null;
        project.messages.push({ role: "user", content: prompt, timestamp: new Date() });
        await project.save();
        revisionStarted = true;

        // Build a compact manifest (path + hash + byte size).
        const manifest = buildManifest(currentFiles);

        // Include file contents so AI can produce accurate search/replace operations.
        const releventFiles = {};
        for (const [path, entry] of Object.entries(currentFiles)) {
            releventFiles[path] = entry.content;
        }

        const recentMessages = project.messages.slice(-4).map((message) => ({
            role: message.role,
            content: message.content,
        }));

        const result = await reviseProject(prompt, manifest, releventFiles, recentMessages);
        console.log(`[AI] Got ${result.operations.length} operations: ${result.description}`);

        // applyOperations returns the updated map under the name "files".
        const { files, applied, errors } = applyOperations(currentFiles, result.operations);
        if (errors.length > 0) console.warn("[Diff] Errors applying operations:", errors);
        if (!files["/App.js"]?.content?.trim()) {
            throw new Error("Revision removed or emptied the project entry point.");
        }

        // Reload after the AI call and avoid overwriting manual edits made meanwhile.
        project = await Project.findOne({ _id: projectId, owner: ownerId });
        if (!project) return res.status(404).json({ error: "Project not found." });
        if (JSON.stringify(project.files) !== originalFiles) {
            project.status = "completed";
            project.error = "Project files changed during revision. Please send the request again.";
            project.messages.push({ role: "assistant", content: project.error });
            await project.save();
            return res.status(409).json({ error: project.error });
        }

        // Update the project in the database using document.save().
        project.files = files;
        project.markModified("files");
        if (applied.length > 0) project.version += 1;
        project.filesGenerated = Object.keys(files);
        project.errors = errors;
        project.status = errors.length > 0 && applied.length === 0 ? "failed" : "completed";
        project.currentFile = null;
        project.error = errors.length > 0 ? "Some revision operations could not be applied." : null;
        project.messages.push({
            role: "assistant",
            content: errors.length > 0
                ? `Applied ${applied.length} operation(s). Failed operations:\n${errors.join("\n")}`
                : result.description || "Revision complete.",
            timestamp: new Date(),
        });
        await project.save();

        // Match getProject: the client receives plain source text for each file.
        const response = project.toObject();
        delete response.owner;
        delete response.__v;
        response.files = Object.fromEntries(Object.entries(files).map(([path, entry]) => [path, entry.content]));
        response.filesPlanned = response.filesplaned || [];
        delete response.filesplaned;
        return res.status(200).json(response);
    } catch (error) {
        if (!revisionStarted && error?.name === "CastError") {
            return res.status(404).json({ error: "Project not found." });
        }
        if (revisionStarted) {
            try {
                // Reload so unsaved revision changes are not persisted on failure.
                const project = await Project.findOne({ _id: projectId, owner: ownerId });
                if (project) {
                    project.status = "failed";
                    project.currentFile = null;
                    project.error = "Project revision failed. Please try again.";
                    project.messages.push({ role: "assistant", content: project.error, timestamp: new Date() });
                    await project.save();
                }
            } catch {
                // Still return an HTTP response if recording the failure fails.
            }
        }
        return res.status(500).json({ error: "Project revision failed. Please try again." });
    } finally {
        activeRevisions.delete(projectId);
    }

}
