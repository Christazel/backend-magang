import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

export const getBucket = () => {
  const db = mongoose.connection?.db;
  if (!db) {
    throw new Error("MongoDB belum connect. Pastikan connectDB() dipanggil dulu.");
  }

  // ✅ cache global biar gak bikin bucket berkali-kali saat hot-reload / serverless warm
  if (!globalThis._laporanBucket) {
    globalThis._laporanBucket = new GridFSBucket(db, { bucketName: "laporan" });
  }

  return globalThis._laporanBucket;
};
