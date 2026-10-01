import mongoose from "mongoose";

/**
 * Single shared Mongoose connection for every app in the monorepo.
 * Calling connectDB() more than once reuses the connection that is already open.
 */
let connecting: Promise<typeof mongoose> | null = null;

export async function connectDB(uri: string | undefined = process.env.MONGO_URI): Promise<typeof mongoose> {
    if (mongoose.connection.readyState === 1) return mongoose;
    if (connecting) return connecting;

    if (!uri) {
        throw new Error("MONGO_URI is not set. Add it to the app's .env file before calling connectDB().");
    }

    connecting = mongoose.connect(uri).then((instance) => {
        connecting = null;
        return instance;
    }).catch((error) => {
        connecting = null;
        throw error;
    });

    return connecting;
}

export async function disconnectDB(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
}

export { mongoose };
export type { Types, Document } from "mongoose";
