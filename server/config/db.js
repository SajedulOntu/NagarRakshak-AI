import mongoose from "mongoose";


export async function connectDatabase() {

    try {

        const connection = await mongoose.connect(
            process.env.MONGO_URI,
            {
                serverSelectionTimeoutMS: 30000,
                connectTimeoutMS: 30000,
                socketTimeoutMS: 45000,

                tls: true
            }
        );


        console.log(
            `MongoDB connected: ${connection.connection.host}`
        );


    } catch (error) {


        console.error(
            "MongoDB connection failed:"
        );


        console.error(
            error.message
        );


        throw error;

    }

}