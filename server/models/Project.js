import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
    {
        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false },
);


// Planned Files Schema .

const PlannedFileSchema = new Schema({
    path:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true
    },
},{_id:false})


const ProjectSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
             default:"Untitled Project"
        },
        description: {
            type: String,
            default: "",
        },
        version: {
            type: Number,
            default: 1,
            min: 1,
        },
        filesRevision: {
            type: Number,
            // No default: saving legacy metadata must not reset a concurrent increment.
        },
        status: {
            type: String,
            enum: [
                "pending",
                "generating",
                "updating",
                "revising",
                "completed",
                "ready",
                "failed",
                "error",
            ],
            default: "pending",
        },
        published: {
            type: Boolean,
            default: false,
        },
        files: {
            type: Schema.Types.Mixed,
            default: () => ({}),
            // validate: {
            //     validator: (value) => value !== null && typeof value === "object" && !Array.isArray(value),
            //     message: "Project files must be an object.",
            // },
        },
        messages: {
            type: [MessageSchema],
            default: [],
        },
        errors: {
            type: [String],
            default: [],
        },
        filesplaned:{
            type:[PlannedFileSchema],
            default:[],
        },
        filesGenerated:{
            type:[String],default:null
        },
        currentFile: { type: String, default: null },
        error:{
            type:String,
            default:null,
        }
    },
    { timestamps: true },
);

// Keep the marker in the same atomic write as files, including manual saves
// and progressive generation. $inc also handles saves from stale documents.
ProjectSchema.pre("save", function () {
    if (this.isModified("files")) this.$inc("filesRevision", 1);
});

const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);

export default Project;
