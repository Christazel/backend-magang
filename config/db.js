import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection.readyState === 1) return mongoose.connection;

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI belum di-set di environment variables");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // opsi ini aman, boleh ditambah sesuai kebutuhan
      serverSelectionTimeoutMS: 10000,
    });

    console.log("✅ MongoDB Connected:", conn.connection.host);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    throw error; // jangan process.exit di serverless
  }
};

export default connectDB;
