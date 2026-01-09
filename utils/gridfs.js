import mongoose from "mongoose";

export const getBucket = () => {
  const db = mongoose.connection?.db;
  if (!db) throw new Error("MongoDB belum connect. Pastikan koneksi mongoose sudah siap.");

  if (!globalThis._laporanBucket) {
    globalThis._laporanBucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: "laporan",
    });
  }

  return globalThis._laporanBucket;
};
