import mongoose from "mongoose";

const ConnectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB)
        console.log(`MongoDB connected: ${mongoose.connection.host}`)
    } catch (error) {
        console.log("error while connecting to DB")
        console.error(error.message)
    }
}

export default ConnectDB