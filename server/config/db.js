import mongoose from "mongoose";

export async function connectToDatabase() {

    mongoose.connection.on('connected',()=>{
        console.log("Connected to mongo DB")
    })

    await mongoose.connect(process.env.MONGODB_URI)

    
}