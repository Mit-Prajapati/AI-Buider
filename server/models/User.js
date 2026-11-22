import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";

export const MAX_BCRYPT_PASSWORD_BYTES = 72;

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            validate: {
                validator: (value) => Buffer.byteLength(value, "utf8") <= MAX_BCRYPT_PASSWORD_BYTES,
                message: `Password must not exceed ${MAX_BCRYPT_PASSWORD_BYTES} UTF-8 bytes.`,
            },
            select: false,
        },
    },
    { timestamps: true },
);

UserSchema.pre("save", async function hashPassword() {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
    if (
        typeof candidatePassword !== "string" ||
        Buffer.byteLength(candidatePassword, "utf8") > MAX_BCRYPT_PASSWORD_BYTES
    ) {
        return Promise.resolve(false);
    }

    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
